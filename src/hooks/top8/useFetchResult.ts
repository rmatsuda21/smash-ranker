import { useClient } from "urql";
import type { Client } from "urql";

import { graphql } from "@/gql";
import type { EventStandingsQuery, PlayerSetsQuery } from "@/gql/graphql";

import { PlayerInfo } from "@/types/top8/Player";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { TournamentInfo } from "@/types/top8/Tournament";

const DEFAULT_CHARACTER = "1293"; // Puff <3

const Top8Query = graphql(`
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
            }
          }
        }
      }
    }
  }
`);

const PlayerSetsQuery = graphql(`
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

type StandingNode = NonNullable<
  NonNullable<EventStandingsQuery["event"]>["standings"]
>["nodes"];

const getPlayers = (standings: StandingNode): PlayerInfo[] => {
  if (!standings) return [];

  const players = new Map<string, PlayerInfo>();

  for (const standing of standings) {
    if (!standing || !standing.entrant?.id || !standing.player?.user?.id)
      continue;

    const playerId = standing.player.user.id;

    players.set(playerId, {
      id: playerId,
      entrantId: standing.entrant.id,
      name: standing.player.gamerTag || "Unknown",
      characters: [],
      placement: standing.placement || 0,
      gamerTag: standing.player.gamerTag || "Unknown",
      prefix: standing.player.prefix || undefined,
      twitter:
        standing.player.user?.authorizations?.[0]?.externalUsername ||
        undefined,
    });
  }

  return Array.from(players.values()).sort((a, b) => a.placement - b.placement);
};

const getPlayerCharacters = async (
  client: Client,
  slug: string,
  entrantId: string
): Promise<string[]> => {
  const result = await client
    .query(PlayerSetsQuery, { slug, entrantId })
    .toPromise();

  if (result.error || !result.data) {
    console.error("Error fetching player characters:", result.error);
    return [];
  }

  const characters = new Map<string, number>();
  const sets = result.data.event?.sets?.nodes;

  if (!sets) return [];

  for (const set of sets) {
    if (!set?.games) continue;

    for (const game of set.games) {
      if (!game?.selections) continue;

      for (const selection of game.selections) {
        if (selection?.entrant?.id === entrantId && selection?.character?.id) {
          characters.set(
            selection.character.id,
            (characters.get(selection.character.id) || 0) + 1
          );
        }
      }
    }
  }

  return Array.from(characters.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => String(id));
};

export const useFetchResult = () => {
  const client = useClient();
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  const fetchResult = async (slug: string, playerCount: number = 8) => {
    playerDispatch({ type: "FETCH_PLAYERS" });

    const result = await client
      .query(Top8Query, { slug, playerCount })
      .toPromise();

    if (result.error || !result.data?.event) {
      playerDispatch({
        type: "FETCH_PLAYERS_FAIL",
        payload: result.error?.message || "Failed to fetch top 8 data",
      });
      alert(result.error?.message || "Tournament not found");
      return;
    }

    const data = result.data;
    const standings = data?.event?.standings?.nodes;
    const tournamentName = data?.event?.tournament?.name;
    const eventName = data?.event?.name;
    const location = data?.event?.tournament?.addrState;
    const city = data?.event?.tournament?.city;
    const country = data?.event?.tournament?.countryCode;
    const teamRosterSize = data?.event?.teamRosterSize;
    const tournamentUrl = data?.event?.tournament?.url;

    const date = data?.event?.startAt
      ? new Date(data.event.startAt * 1000).toISOString()
      : new Date().toISOString();

    const tournamentInfo: TournamentInfo = {
      tournamentName: tournamentName || "",
      eventName: eventName || "",
      location: {
        state: location || "",
        city: city || "",
        country: country || "",
      },
      date: date,
      entrants:
        data?.event?.entrants?.pageInfo?.total ||
        teamRosterSize?.maxPlayers ||
        0,
      url: tournamentUrl || "",
    };

    tournamentDispatch({
      type: "SET_TOURNAMENT_INFO",
      payload: tournamentInfo,
    });

    const players = getPlayers(standings);

    const results = await Promise.allSettled(
      players.map(async (player) => {
        const characters = await getPlayerCharacters(
          client,
          slug,
          player.entrantId
        );

        if (characters.length > 0) {
          player.characters = characters.map((character) => ({
            id: character,
            alt: 0,
          }));
        } else {
          player.characters = [{ id: DEFAULT_CHARACTER, alt: 0 }];
        }
        player.id = player.id.toString();
      })
    );

    if (results.every((result) => result.status === "fulfilled")) {
      playerDispatch({ type: "FETCH_PLAYERS_SUCCESS", payload: players });
    } else {
      playerDispatch({
        type: "FETCH_PLAYERS_FAIL",
        payload: "Failed to fetch characters for all players",
      });
    }
  };

  return { fetchResult };
};
