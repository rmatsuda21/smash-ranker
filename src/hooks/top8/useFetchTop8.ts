import { useQuery } from "urql";
import { graphql } from "@/gql";
import { Result } from "@/types/top8/Result";
import { useMemo } from "react";

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

export const useFetchTop8 = (slug: string) => {
  const [result] = useQuery({
    query: Top8Query,
    variables: {
      slug: slug,
    },
  });

  const { data, fetching, error } = result;

  const top8: Result = useMemo(
    () =>
      data?.event?.standings?.nodes
        ?.map((node) => {
          const entrant = node?.entrant;
          const games = entrant?.paginatedSets?.nodes?.[0]?.games;
          const selections = games?.[0]?.selections;
          const player = selections?.find(
            (selection) => selection?.entrant?.id === entrant?.id
          );
          const character = player?.character?.id;

          return {
            id: entrant?.id || "",
            name: entrant?.name || "",
            placement: node?.placement || 0,
            character: character || "",
            alt: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
          };
        })
        .sort((a, b) => a.placement - b.placement) || [],
    [data]
  );

  return { fetching, error, top8 };
};
