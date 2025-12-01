import { useClient } from "urql";
import type { Client } from "urql";

import { graphql } from "@/gql";
import type { EventStandingsQuery, PlayerSetsQuery } from "@/gql/graphql";

import { PlayerInfo } from "@/types/top8/PlayerTypes";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { TournamentInfo } from "@/types/top8/TournamentTypes";

// const UltimateCharacterQuery = graphql(`
//   query UltimateCharacters {
//     videogame(slug: "Ultimate") {
//       characters {
//         id
//         name
//       }
//     }
//   }
// `);

const Top8Query = graphql(`
  query EventStandings($slug: String!) {
    event(slug: $slug) {
      id
      name
      startAt
      tournament {
        name
        venueAddress
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
      standings(query: { perPage: 8, page: 1 }) {
        nodes {
          placement
          entrant {
            id
            name
          }
          player {
            gamerTag
            prefix
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

const getTop8Players = (standings: StandingNode): PlayerInfo[] => {
  if (!standings) return [];

  const players = new Map<string, PlayerInfo>();

  for (const standing of standings) {
    if (!standing || !standing.entrant?.id) continue;

    players.set(standing.entrant.id, {
      id: standing.entrant.id,
      name: standing.entrant.name || "Unknown",
      characters: [],
      placement: standing.placement || 0,
      gamerTag: standing.player?.gamerTag || "Unknown",
      prefix: standing.player?.prefix || undefined,
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

export const useFetchTop8 = () => {
  const client = useClient();
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  const fetchTop8 = async (slug: string) => {
    playerDispatch({ type: "FETCH_PLAYERS" });

    const result = await client.query(Top8Query, { slug }).toPromise();

    if (result.error || !result.data) {
      playerDispatch({
        type: "FETCH_PLAYERS_FAIL",
        payload: result.error?.message || "Failed to fetch top 8 data",
      });
      return;
    }

    const data = result.data;
    const standings = data?.event?.standings?.nodes;
    const tournamentName = data?.event?.tournament?.name;
    const eventName = data?.event?.name;
    const venueAddress = data?.event?.tournament?.venueAddress;
    const teamRosterSize = data?.event?.teamRosterSize;

    const date = data?.event?.startAt
      ? new Date(data.event.startAt * 1000)
      : null;

    const tournamentInfo: TournamentInfo = {
      tournamentName: tournamentName || "",
      eventName: eventName || "",
      location: venueAddress || "",
      date: date || new Date(),
      entrants:
        data?.event?.entrants?.pageInfo?.total ||
        teamRosterSize?.maxPlayers ||
        0,
    };

    console.log("tournamentInfo", data?.event);

    tournamentDispatch({
      type: "SET_TOURNAMENT_INFO",
      payload: tournamentInfo,
    });

    const players = getTop8Players(standings);

    const results = await Promise.allSettled(
      players.map(async (player) => {
        const characters = await getPlayerCharacters(client, slug, player.id);
        player.characters = characters.map((character) => ({
          id: character,
          alt: 0,
        }));
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

  return { fetchTop8 };
};
