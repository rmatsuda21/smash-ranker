import { useClient } from "urql";
import type { Client } from "urql";
import * as countryList from "country-list";

import { graphql } from "@/gql";
import type { EventStandingsQuery, PlayerSetsQuery } from "@/gql/graphql";
import { PlayerInfo } from "@/types/top8/Player";
import { TournamentInfo } from "@/types/top8/Tournament";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { assetRepository } from "@/db/repository";
import { createBlankPlayer, getPlacements } from "@/utils/top8/samplePlayers";

const DEFAULT_CHARACTER_ID = "1293"; // Puff <3
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
  NonNullable<NonNullable<PlayerSetsQuery["event"]>["sets"]>["nodes"]
>;
type TournamentImages = NonNullable<NonNullable<Event["tournament"]>["images"]>;

const EventStandingsQueryDoc = graphql(`
  query EventStandings($slug: String!, $playerCount: Int!) {
    event(slug: $slug) {
      id
      name
      startAt
      tournament {
        name
        addrState
        city
        countryCode
        url(tab: "", relative: false)
        images {
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

const PlayerSetsQueryDoc = graphql(`
  query PlayerSets($slug: String!, $entrantId: ID!) {
    event(slug: $slug) {
      sets(perPage: 50, page: 1, filters: { entrantIds: [$entrantId] }) {
        nodes {
          games {
            selections {
              character {
                id
              }
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

const fetchImage = async (image: TournamentImage): Promise<FetchedImage> => {
  const response = await fetch(image.url);

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
  images: TournamentImage[]
): Promise<StoredImagesMap> => {
  const fetchResults = await Promise.allSettled(images.map(fetchImage));

  const storedImages: StoredImagesMap = new Map();
  for (const result of fetchResults) {
    if (result.status === "fulfilled") {
      try {
        const src = await storeImage(result.value);
        storedImages.set(result.value.type, src);
      } catch (error) {
        console.error("Failed to store tournament image:", error);
      }
    } else {
      console.error("Failed to fetch tournament image:", result.reason);
    }
  }

  return storedImages;
};

const isValidStanding = (standing: StandingNode): boolean => {
  return Boolean(standing?.entrant?.id && standing?.player?.user?.id);
};

const extractPlayerFromStanding = (standing: StandingNode): PlayerInfo => {
  const player = standing!.player!;
  const entrant = standing!.entrant!;
  const twitterHandle = player.user?.authorizations?.[0]?.externalUsername;

  const countryName = player.user?.location?.country;
  const countryCode = countryList.getCode(countryName ?? "");

  return {
    id: player.user!.id as string,
    entrantId: entrant.id as string,
    name: player.gamerTag || "Unknown",
    gamerTag: player.gamerTag || "Unknown",
    prefix: player.prefix || undefined,
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
    playersById.set(player.id, player);
  }

  return Array.from(playersById.values()).sort(
    (a, b) => a.placement - b.placement
  );
};

const fetchPlayerCharacters = async (
  client: Client,
  slug: string,
  entrantId: string
): Promise<string[]> => {
  const result = await client
    .query(PlayerSetsQueryDoc, { slug, entrantId })
    .toPromise();

  const nodes = result.data?.event?.sets?.nodes;

  if (result.error || !nodes) {
    console.error("Error fetching player characters:", result.error);
    return [];
  }

  const characterUsageCount = countCharacterUsage(nodes, entrantId);

  return sortCharactersByUsage(characterUsageCount);
};

const countCharacterUsage = (
  sets: Sets,
  entrantId: string
): Map<string, number> => {
  const usageCount = new Map<string, number>();

  for (const set of sets) {
    if (!set?.games) continue;

    for (const game of set.games) {
      if (!game?.selections) continue;

      for (const selection of game.selections) {
        const isPlayerSelection = selection?.entrant?.id === entrantId;
        const characterId = selection?.character?.id;

        if (isPlayerSelection && characterId) {
          usageCount.set(characterId, (usageCount.get(characterId) || 0) + 1);
        }
      }
    }
  }

  return usageCount;
};

const sortCharactersByUsage = (usageCount: Map<string, number>): string[] => {
  return Array.from(usageCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([characterId]) => String(characterId));
};

const addCharactersToPlayers = async (
  client: Client,
  slug: string,
  players: PlayerInfo[]
): Promise<void> => {
  await Promise.all(
    players.map(async (player) => {
      const characterIds = await fetchPlayerCharacters(
        client,
        slug,
        player.entrantId
      );

      player.characters =
        characterIds.length > 0
          ? characterIds.map((id) => ({ id, alt: 0 }))
          : [{ id: DEFAULT_CHARACTER_ID, alt: 0 }];

      player.id = String(player.id);
    })
  );
};

const filterValidImages = (
  images?: TournamentImages | null
): TournamentImage[] => {
  if (!images) return [];

  return images.filter((img): img is TournamentImage => img !== null);
};

const padPlayersWithBlanks = (
  players: PlayerInfo[],
  targetCount: number
): PlayerInfo[] => {
  if (players.length >= targetCount) {
    return players;
  }

  const placements = getPlacements(targetCount);
  const paddedPlayers = [...players];

  for (let i = players.length; i < targetCount; i++) {
    paddedPlayers.push(createBlankPlayer(placements[i]));
  }

  return paddedPlayers;
};

const buildTournamentInfo = (
  event: Event,
  storedImages?: StoredImagesMap
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

  const fetchResult = async (slug: string, playerCount: number = 8) => {
    playerDispatch({ type: "FETCH_PLAYERS" });

    const result = await client
      .query(EventStandingsQueryDoc, { slug, playerCount })
      .toPromise();

    if (result.error || !result.data?.event) {
      const errorMessage = result.error?.message || "Tournament not found";
      playerDispatch({ type: "FETCH_PLAYERS_FAIL", payload: errorMessage });
      alert(errorMessage);
      return;
    }

    const event = result.data.event;
    const validImages = filterValidImages(event.tournament?.images ?? null);
    const players = parseStandingsToPlayers(event.standings?.nodes ?? null);

    try {
      const [storedImages] = await Promise.all([
        validImages.length > 0 ? storeTournamentImages(validImages) : undefined,
        addCharactersToPlayers(client, slug, players),
      ]);

      const tournamentInfo = buildTournamentInfo(event, storedImages);
      tournamentDispatch({
        type: "SET_TOURNAMENT_INFO",
        payload: tournamentInfo,
      });

      const paddedPlayers = padPlayersWithBlanks(players, playerCount);
      playerDispatch({ type: "FETCH_PLAYERS_SUCCESS", payload: paddedPlayers });
    } catch (error) {
      console.error("Failed to fetch tournament data:", error);
      playerDispatch({
        type: "FETCH_PLAYERS_FAIL",
        payload: "Failed to fetch tournament data",
      });
    }
  };

  return { fetchResult };
};
