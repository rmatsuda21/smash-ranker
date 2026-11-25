import { useClient } from "urql";
import type { Client } from "urql";
import * as countryList from "country-list";

import { t } from "@lingui/core/macro";
import { graphql } from "@/gql";
import type { EventStandingsQuery, PlayerSetsQuery } from "@/gql/graphql";
import { CharacerData, PlayerInfo, TeammateInfo } from "@/types/top8/Player";
import { TournamentInfo } from "@/types/top8/Tournament";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { assetRepository } from "@/db/repository";
import {
  assignPlacementsToPlayers,
  padPlayersWithBlanks,
} from "@/utils/top8/samplePlayers";
import { getMultiGroupError } from "@/consts/errors";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import { isKnownCharacter } from "@/utils/top8/characterCatalog";
import { getGameForStartggVideogame } from "@/utils/games";
import { useToast } from "@/components/Toast";
import { logError, logEvent, logWarning } from "@/utils/observability/log";
const IDB_IMAGES_BASE_URL = "/idb-images/";

interface TournamentImage {
  url: string;
  type: string;
  id: string;
}

type Event = NonNullable<EventStandingsQuery["event"]>;
type Standings = NonNullable<Event["standings"]>["nodes"];
type StandingNode = NonNullable<Standings>[number];
type StoredImagesMap = Map<string, string>;
type Sets = NonNullable<
  NonNullable<NonNullable<PlayerSetsQuery["entrant"]>["paginatedSets"]>["nodes"]
>;
type Participant = NonNullable<
  NonNullable<NonNullable<StandingNode>["entrant"]>["participants"]
>[number];
type TournamentImages = NonNullable<NonNullable<Event["tournament"]>["images"]>;

const EventStandingsQueryDoc = graphql(`
  query EventStandings($slug: String!, $playerCount: Int!) {
    event(slug: $slug) {
      id
      name
      startAt
      videogame {
        id
      }
      tournament {
        id
        name
        addrState
        city
        countryCode
        url(tab: "", relative: false)
        images(type: "profile") {
          url
          type
          id
        }
      }
      teamRosterSize {
        maxPlayers
        minPlayers
      }
      entrants(query: {}) {
        pageInfo {
          total
        }
      }
      phases {
        bracketType
        groupCount
      }
      standings(query: { perPage: $playerCount, page: 1 }) {
        nodes {
          placement
          entrant {
            id
            name
            participants {
              id
              gamerTag
              prefix
              user {
                id
                authorizations(types: [TWITTER]) {
                  id
                  externalId
                  externalUsername
                }
                location {
                  country
                  countryId
                }
              }
            }
          }
          player {
            gamerTag
            prefix
            user {
              id
              authorizations(types: [TWITTER]) {
                id
                externalId
                externalUsername
              }
              location {
                country
                countryId
              }
            }
          }
        }
      }
    }
  }
`);

// Asked of the entrant rather than of the event's set list filtered by
// entrant, and with the pick as a plain value: the same sets for about a
// quarter fewer objects, and a faster answer.
const PlayerSetsQueryDoc = graphql(`
  query PlayerSets($entrantId: ID!) {
    entrant(id: $entrantId) {
      paginatedSets(perPage: 50, page: 1, filters: { hideEmpty: true }) {
        nodes {
          games {
            selections {
              selectionType
              selectionValue
              entrant {
                id
              }
              participant {
                id
              }
            }
          }
        }
      }
    }
  }
`);

interface FetchedImage {
  type: string;
  id: string;
  data: Blob;
}

const upgradeToHttps = (url: string): string => {
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

const fetchImage = async (image: TournamentImage): Promise<FetchedImage> => {
  const secureUrl = upgradeToHttps(image.url);
  const response = await fetch(secureUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const data = await response.blob();
  return { type: image.type, id: image.id, data };
};

const storeImage = async (fetchedImage: FetchedImage): Promise<string> => {
  const id = crypto.randomUUID();
  const src = `${IDB_IMAGES_BASE_URL}${id}`;
  const fileName = `tournament-${fetchedImage.type}-${fetchedImage.id}`;

  await assetRepository.put({
    id,
    src,
    fileName,
    data: fetchedImage.data,
    date: new Date(),
  });

  return src;
};

const storeTournamentImages = async (
  images: TournamentImage[],
): Promise<StoredImagesMap> => {
  const fetchResults = await Promise.allSettled(images.map(fetchImage));

  const storedImages: StoredImagesMap = new Map();
  for (const result of fetchResults) {
    if (result.status === "fulfilled") {
      try {
        const src = await storeImage(result.value);
        storedImages.set(result.value.type, src);
      } catch (error) {
        logError(error, { area: "tournament-image-store" });
      }
    } else {
      logError(result.reason, { area: "tournament-image-fetch" });
    }
  }

  return storedImages;
};

const isValidStanding = (standing: StandingNode): boolean => {
  return Boolean(standing?.entrant?.id);
};

// A team's entrant is named "A / B", and start.gg lists a game's picks in
// that order, which is not always the order of `participants`. Members are
// put in name order so the first one is the first name and the first pick.
const inNameOrder = (
  participants: NonNullable<Participant>[],
  entrantName: string,
): NonNullable<Participant>[] => {
  const position = (participant: NonNullable<Participant>) => {
    const index = participant.gamerTag
      ? entrantName.indexOf(participant.gamerTag)
      : -1;
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...participants].sort((a, b) => position(a) - position(b));
};

const toTeammate = (participant: NonNullable<Participant>): TeammateInfo => {
  const gamerTag = participant.gamerTag || "";
  const countryCode = countryList.getCode(
    participant.user?.location?.country ?? "",
  );

  return {
    name: gamerTag,
    gamerTag,
    prefix: participant.prefix || undefined,
    twitter:
      participant.user?.authorizations?.[0]?.externalUsername || undefined,
    characters: [],
    country: countryCode || undefined,
  };
};

// A standing's player, and for a team the participant ids of its two
// members (first player, then teammate), which picks are matched against.
type ParsedStanding = { player: PlayerInfo; memberIds: string[] };

const extractPlayerFromStanding = (standing: StandingNode): ParsedStanding => {
  const entrant = standing!.entrant!;
  const placement = standing!.placement || 0;
  const members = inNameOrder(
    (entrant.participants ?? []).filter((p) => p !== null),
    entrant.name ?? "",
  );

  // Doubles: a team's standing has no player of its own, only the
  // entrant's participants. Teams bigger than two keep their first two.
  if (members.length > 1) {
    const [first, second] = members.map(toTeammate);
    const userId = members[0].user?.id;

    return {
      player: {
        ...first,
        id: userId ? String(userId) : `entrant-${entrant.id}`,
        entrantId: entrant.id as string,
        name: entrant.name || first.gamerTag || "Unknown",
        gamerTag: first.gamerTag || entrant.name || "Unknown",
        placement,
        teammate: second,
      },
      memberIds: members.slice(0, 2).map((member) => String(member.id)),
    };
  }

  const player = standing?.player;
  const twitterHandle = player?.user?.authorizations?.[0]?.externalUsername;

  const countryName = player?.user?.location?.country;
  const countryCode = countryList.getCode(countryName ?? "");

  const id = player?.user?.id
    ? String(player.user.id)
    : `entrant-${entrant.id}`;
  const gamerTag = player?.gamerTag || entrant.name || "Unknown";

  return {
    player: {
      id,
      entrantId: entrant.id as string,
      name: gamerTag,
      gamerTag,
      prefix: player?.prefix || undefined,
      twitter: twitterHandle || undefined,
      characters: [],
      placement,
      country: countryCode || undefined,
    },
    memberIds: [],
  };
};

type ParsedStandings = {
  players: PlayerInfo[];
  // Participant ids of each team's members, by entrant id.
  memberIds: Map<string, string[]>;
};

const parseStandingsToPlayers = (
  standings: Standings | null,
): ParsedStandings => {
  const memberIds = new Map<string, string[]>();
  if (!standings) return { players: [], memberIds };

  const playersById = new Map<string, PlayerInfo>();

  for (const standing of standings) {
    if (!isValidStanding(standing)) continue;

    const parsed = extractPlayerFromStanding(standing);
    playersById.set(parsed.player.entrantId, parsed.player);
    if (parsed.memberIds.length > 0) {
      memberIds.set(parsed.player.entrantId, parsed.memberIds);
    }
  }

  const sorted = Array.from(playersById.values()).sort(
    (a, b) => a.placement - b.placement,
  );
  return { players: assignPlacementsToPlayers(sorted), memberIds };
};

// The characters an entrant used, most used first: one list for a single
// player, one per member (in the order of `memberIds`) for a team.
const fetchEntrantCharacters = async (
  client: Client,
  slug: string,
  entrantId: string,
  memberIds: string[] = [],
): Promise<string[][]> => {
  const memberCount = Math.max(memberIds.length, 1);
  const result = await client
    .query(PlayerSetsQueryDoc, { entrantId })
    .toPromise();

  const nodes = result.data?.entrant?.paginatedSets?.nodes;

  if (result.error || !nodes) {
    if (result.error) {
      // Per-entrant character fetches are best-effort; transient start.gg
      // flakes shouldn't inflate Sentry exception counts. Warning level keeps
      // the trail without a noisy alert.
      logWarning("player characters fetch failed", {
        area: "tournament-fetch",
        tournament_platform: "startgg",
        tournament_slug: slug,
        entrant_id: entrantId,
        step: "player-characters",
        error: result.error.message,
      });
    }
    return Array.from({ length: memberCount }, () => []);
  }

  return countCharacterUsage(nodes, entrantId, memberIds).map(
    sortCharactersByUsage,
  );
};

// One count per member. A team's picks rarely name their player (start.gg
// fills `participant` in only sometimes): a game then lists one pick per
// member in the order of the entrant's name, so they are matched by
// position, and a game with any other number of picks for the team cannot
// be attributed and is left out.
const countCharacterUsage = (
  sets: Sets,
  entrantId: string,
  memberIds: string[],
): Map<string, number>[] => {
  const memberCount = Math.max(memberIds.length, 1);
  const usageCounts = Array.from(
    { length: memberCount },
    () => new Map<string, number>(),
  );
  const count = (member: number, value: number) => {
    const characterId = String(value);
    const usage = usageCounts[member];
    usage.set(characterId, (usage.get(characterId) || 0) + 1);
  };

  for (const set of sets) {
    if (!set?.games) continue;

    for (const game of set.games) {
      const picks = (game?.selections ?? []).filter(
        (selection) =>
          selection?.selectionType === "CHARACTER" &&
          selection.selectionValue != null &&
          String(selection.entrant?.id) === String(entrantId),
      );

      picks.forEach((pick, position) => {
        const named = memberIds.indexOf(String(pick?.participant?.id));
        const member =
          memberCount === 1
            ? 0
            : named !== -1
              ? named
              : picks.length === memberCount
                ? position
                : -1;
        if (member !== -1) count(member, pick!.selectionValue!);
      });
    }
  }

  return usageCounts;
};

const sortCharactersByUsage = (usageCount: Map<string, number>): string[] => {
  return (
    Array.from(usageCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([characterId]) => String(characterId))
      // Picks the site has no art for (another game, or Random) would draw
      // as broken images.
      .filter(isKnownCharacter)
  );
};

const toCharacters = (characterIds: string[]): CharacerData[] =>
  characterIds.length > 0
    ? characterIds.map((id) => ({ id, alt: 0 }))
    : [{ id: EMPTY_CHARACTER_ID, alt: 0 }];

type MemberCharacters = { player: CharacerData[]; teammate?: CharacerData[] };

const fetchMemberCharacters = async (
  client: Client,
  slug: string,
  player: PlayerInfo,
  memberIds: Map<string, string[]>,
): Promise<MemberCharacters> => {
  const [first, second] = await fetchEntrantCharacters(
    client,
    slug,
    player.entrantId,
    memberIds.get(player.entrantId),
  );
  return {
    player: toCharacters(first),
    teammate: player.teammate && toCharacters(second ?? []),
  };
};

const addCharactersToPlayers = async (
  client: Client,
  slug: string,
  players: PlayerInfo[],
  memberIds: Map<string, string[]>,
): Promise<void> => {
  await Promise.all(
    players.map(async (player) => {
      const characters = await fetchMemberCharacters(
        client,
        slug,
        player,
        memberIds,
      );
      player.characters = characters.player;
      if (player.teammate && characters.teammate) {
        player.teammate.characters = characters.teammate;
      }
    }),
  );
};

// How many of the players the graphic is not showing are looked up at a time
// once it is on screen.
const BACKGROUND_CHUNK_SIZE = 6;

// Characters for the players the design has no slot for yet (a load fetches
// 32 players so a bigger template can be switched to without loading again).
// They are filled in a few at a time after the graphic is up, and the work
// stops as soon as another tournament starts loading, so loads in quick
// succession do not pile requests up against start.gg's 80 a minute.
const addCharactersInBackground = async (
  client: Client,
  slug: string,
  players: PlayerInfo[],
  memberIds: Map<string, string[]>,
): Promise<void> => {
  let cancelled = false;
  const unsubscribe = usePlayerStore.subscribe((state) => {
    if (state.fetching) cancelled = true;
  });

  try {
    for (let i = 0; i < players.length; i += BACKGROUND_CHUNK_SIZE) {
      const chunk = players.slice(i, i + BACKGROUND_CHUNK_SIZE);
      const characters = await Promise.all(
        chunk.map((player) =>
          fetchMemberCharacters(client, slug, player, memberIds),
        ),
      );
      if (cancelled) return;

      usePlayerStore.getState().dispatch({
        type: "FILL_PLAYER_CHARACTERS",
        payload: Object.fromEntries(
          chunk.map((player, index) => [player.entrantId, characters[index]]),
        ),
      });
    }
  } finally {
    unsubscribe();
  }
};

const filterValidImages = (
  images?: TournamentImages | null,
): TournamentImage[] => {
  if (!images) return [];

  return images.filter((img): img is TournamentImage => img !== null);
};

const buildTournamentInfo = (
  event: Event,
  storedImages?: StoredImagesMap,
): TournamentInfo => {
  const tournament = event.tournament;

  const eventDate = event.startAt
    ? new Date(event.startAt * 1000).toISOString()
    : new Date().toISOString();

  const entrantCount =
    event.entrants?.pageInfo?.total || event.teamRosterSize?.maxPlayers || 0;

  return {
    tournamentName: tournament?.name || "",
    eventName: event.name || "",
    location: {
      state: tournament?.addrState || "",
      city: tournament?.city || "",
      country: tournament?.countryCode || "",
    },
    date: eventDate,
    entrants: entrantCount,
    url: tournament?.url || "",
    startggId: tournament?.id ? String(tournament.id) : undefined,
    iconSrc: storedImages?.get("profile"),
  };
};

export const useFetchResult = () => {
  const client = useClient();
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const { showToast } = useToast();

  // `playerCount` players are loaded; the first `visibleCount` (the design's
  // slots) get their characters before the graphic is shown, the rest after.
  const fetchResult = async (
    slug: string,
    playerCount: number = 8,
    visibleCount: number = playerCount,
  ) => {
    playerDispatch({ type: "FETCH_PLAYERS" });

    const result = await client
      .query(EventStandingsQueryDoc, { slug, playerCount })
      .toPromise();

    if (result.error || !result.data?.event) {
      const errorMessage = result.error?.message || t`Tournament not found`;
      playerDispatch({ type: "FETCH_PLAYERS_FAIL", payload: errorMessage });
      showToast(errorMessage, { variant: "error" });
      logEvent("tournament_fetch_fail", {
        tournament_platform: "startgg",
        failure_kind: result.error ? "query_error" : "not_found",
        tournament_slug: slug,
      });
      // Don't Sentry-capture user-input failures (bad slug, deleted event).
      // The PostHog rate is the right signal; bug investigation belongs to
      // the api-side Sentry capture if a real upstream issue surfaces.
      return;
    }

    const event = result.data.event;

    const phases = event.phases ?? [];
    const allNonElimination =
      phases.length > 0 &&
      phases.every(
        (phase) =>
          phase?.bracketType === "ROUND_ROBIN" ||
          phase?.bracketType === "SWISS",
      );
    const hasMultipleGroups = phases.some(
      (phase) => (phase?.groupCount ?? 0) > 1,
    );

    if (allNonElimination && hasMultipleGroups) {
      const errorMessage = getMultiGroupError();
      playerDispatch({ type: "FETCH_PLAYERS_FAIL", payload: errorMessage });
      showToast(errorMessage, { variant: "error" });
      logEvent("tournament_fetch_fail", {
        tournament_platform: "startgg",
        failure_kind: "multi_group",
        tournament_slug: slug,
      });
      return;
    }

    const validImages = filterValidImages(event.tournament?.images ?? null);
    const { players, memberIds } = parseStandingsToPlayers(
      event.standings?.nodes ?? null,
    );
    const visiblePlayers = players.slice(0, visibleCount);
    const laterPlayers = players.slice(visibleCount);
    for (const player of laterPlayers) {
      player.characters = toCharacters([]);
      if (player.teammate) player.teammate.characters = toCharacters([]);
    }

    try {
      const [storedImages] = await Promise.all([
        validImages.length > 0 ? storeTournamentImages(validImages) : undefined,
        addCharactersToPlayers(client, slug, visiblePlayers, memberIds),
      ]);

      const tournamentInfo = buildTournamentInfo(event, storedImages);
      const game = getGameForStartggVideogame(event.videogame?.id);
      if (game) tournamentDispatch({ type: "SET_GAME", payload: game.id });
      tournamentDispatch({
        type: "SET_TOURNAMENT_INFO",
        payload: tournamentInfo,
      });

      const paddedPlayers = padPlayersWithBlanks(players, playerCount);
      playerDispatch({ type: "FETCH_PLAYERS_SUCCESS", payload: paddedPlayers });
      logEvent("tournament_load", {
        tournament_platform: "startgg",
        player_count: playerCount,
      });

      if (laterPlayers.length > 0) {
        // fetchPlayerCharacters reports its own failures and never throws.
        void addCharactersInBackground(client, slug, laterPlayers, memberIds);
      }
    } catch (error) {
      // Post-process failure: image storage, character fetch, IndexedDB write.
      // These are likely real bugs, not user-input issues — keep Sentry capture.
      logError(error, {
        area: "tournament-fetch",
        platform: "startgg",
        step: "post-process",
        slug,
      });
      playerDispatch({
        type: "FETCH_PLAYERS_FAIL",
        payload: t`Failed to fetch tournament data`,
      });
      showToast(t`Failed to fetch tournament data`, { variant: "error" });
      logEvent("tournament_fetch_fail", {
        tournament_platform: "startgg",
        failure_kind: "post_process",
        tournament_slug: slug,
      });
    }
  };

  return { fetchResult };
};
