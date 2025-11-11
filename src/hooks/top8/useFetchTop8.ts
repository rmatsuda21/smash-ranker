import { useMemo } from "react";
import { useQuery } from "urql";

import { graphql } from "@/gql";
import { PlayerInfo } from "@/types/top8/Result";
import type { EventStandingsQuery } from "@/gql/graphql";

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
          player {
            gamerTag
            prefix
          }
          entrant {
            id
            name
            paginatedSets(perPage: 1, page: 1) {
              nodes {
                games {
                  selections {
                    character {
                      id
                      name
                    }
                    entrant {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`);

type StandingNode = NonNullable<
  NonNullable<NonNullable<EventStandingsQuery["event"]>["standings"]>["nodes"]
>[number];

type EntrantType = NonNullable<StandingNode>["entrant"];

const getEntrantCharacter = (entrant: EntrantType): string => {
  if (!entrant) return "";

  const mostRecentSet = entrant.paginatedSets?.nodes?.[0];
  const firstGame = mostRecentSet?.games?.[0];
  const selections = firstGame?.selections;

  if (!selections) return "";

  const entrantSelection = selections.find(
    (selection) => selection?.entrant?.id === entrant.id
  );

  return String(entrantSelection?.character?.id || "");
};

const transformStandingNode = (node: StandingNode): PlayerInfo => {
  const entrant = node?.entrant;
  const characterId = getEntrantCharacter(entrant);

  return {
    id: entrant?.id || "",
    name: entrant?.name || "",
    placement: node?.placement || 0,
    characterId,
    alt: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
    gamerTag: node?.player?.gamerTag || "",
    prefix: node?.player?.prefix || "",
  };
};

const sortByPlacement = (a: PlayerInfo, b: PlayerInfo): number => {
  return a.placement - b.placement;
};

export const useFetchTop8 = (slug: string) => {
  const [result] = useQuery({
    query: Top8Query,
    variables: { slug },
  });

  const { data, fetching, error } = result;

  const top8: PlayerInfo[] = useMemo(() => {
    const standings = data?.event?.standings?.nodes;

    if (!standings) return [];

    return standings.map(transformStandingNode).sort(sortByPlacement);
  }, [data]);

  return { fetching, error, top8 };
};
