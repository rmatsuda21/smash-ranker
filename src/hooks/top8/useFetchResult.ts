import { useClient } from "urql";
import type { Client } from "urql";
import * as countryList from "country-list";

import { t } from "@lingui/core/macro";
import { graphql } from "@/gql";
import type { EventStandingsQuery, PlayerSetsQuery } from "@/gql/graphql";
import { CharacerData, PlayerInfo } from "@/types/top8/Player";
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

const extractPlayerFromStanding = (standing: StandingNode): PlayerInfo => {
  const player = standing?.player;
  const entrant = standing!.entrant!;
  const twitterHandle = player?.user?.authorizations?.[0]?.externalUsername;

  const countryName = player?.user?.location?.country;
  const countryCode = countryList.getCode(countryName ?? "");

  const id = player?.user?.id
    ? String(player.user.id)
    : `entrant-${entrant.id}`;
  const gamerTag = player?.gamerTag || entrant.name || "Unknown";

  return {
    id,
    entrantId: entrant.id as string,
    name: gamerTag,
    gamerTag,
    prefix: player?.prefix || undefined,
    twitter: twitterHandle || undefined,
    characters: [],
    placement: standing!.placement || 0,
    country: countryCode || undefined,
  };
};

const parseStandingsToPlayers = (standings: Standings | null): PlayerInfo[] => {
  if (!standings) return [];

  const playersById = new Map<string, PlayerInfo>();

  for (const standing of standings) {
    if (!isValidStanding(standing)) continue;

    const player = extractPlayerFromStanding(standing);
    playersById.set(player.entrantId, player);
  }

  const sorted = Array.from(playersById.values()).sort(
    (a, b) => a.placement - b.placement,
  );
  return assignPlacementsToPlayers(sorted);
};

const fetchPlayerCharacters = async (
  client: Client,
  slug: string,
  entrantId: string,
): Promise<string[]> => {
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
    return [];
  }

  const characterUsageCount = countCharacterUsage(nodes, entrantId);

  return sortCharactersByUsage(characterUsageCount);
};

const countCharacterUsage = (
  sets: Sets,
  entrantId: string,
): Map<string, number> => {
  const usageCount = new Map<string, number>();

  for (const set of sets) {
    if (!set?.games) continue;

    for (const game of set.games) {
      if (!game?.selections) continue;

      for (const selection of game.selections) {
        if (
          selection?.selectionType !== "CHARACTER" ||
          selection.selectionValue == null ||
          String(selection.entrant?.id) !== String(entrantId)
        ) {
          continue;
        }
        const characterId = String(selection.selectionValue);
        usageCount.set(characterId, (usageCount.get(characterId) || 0) + 1);
      }
    }
  }

  return usageCount;
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

const addCharactersToPlayers = async (
  client: Client,
  slug: string,
  players: PlayerInfo[],
): Promise<void> => {
  await Promise.all(
    players.map(async (player) => {
      player.characters = toCharacters(
        await fetchPlayerCharacters(client, slug, player.entrantId),
      );
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
          fetchPlayerCharacters(client, slug, player.entrantId),
        ),
      );
      if (cancelled) return;

      usePlayerStore.getState().dispatch({
        type: "FILL_PLAYER_CHARACTERS",
        payload: Object.fromEntries(
          chunk.map((player, index) => [
            player.entrantId,
            toCharacters(characters[index]),
          ]),
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
    const players = parseStandingsToPlayers(event.standings?.nodes ?? null);
    const visiblePlayers = players.slice(0, visibleCount);
    const laterPlayers = players.slice(visibleCount);
    for (const player of laterPlayers) player.characters = toCharacters([]);

    try {
      const [storedImages] = await Promise.all([
        validImages.length > 0 ? storeTournamentImages(validImages) : undefined,
        addCharactersToPlayers(client, slug, visiblePlayers),
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
        void addCharactersInBackground(client, slug, laterPlayers);
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
