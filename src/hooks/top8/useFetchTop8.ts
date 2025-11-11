import { useEffect, useState } from "react";
import { useQuery, useClient } from "urql";

import { graphql } from "@/gql";
import { PlayerInfo } from "@/types/top8/Player";
import type { EventStandingsQuery, PlayerSetsQuery } from "@/gql/graphql";
import type { Client } from "urql";

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

export const useFetchTop8 = (slug: string) => {
  const client = useClient();
  const [result] = useQuery({
    query: Top8Query,
    variables: { slug },
  });

  const { data, fetching: resultFetching, error: resultError } = result;

  const [top8, setTop8] = useState<PlayerInfo[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchTop8 = async () => {
      setFetching(true);
      const standings = data?.event?.standings?.nodes;
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
        setTop8(players);
        setFetching(false);
      } else {
        setFetching(false);
        setError("Failed to fetch characters for all players");
      }
    };

    if (!resultFetching) {
      fetchTop8();
    }
  }, [client, slug, data, resultFetching]);

  useEffect(() => {
    if (resultError) {
      setError(resultError.message);
      setFetching(false);
    }
  }, [resultError]);

  return { fetching, error, top8 };
};
