import { useClient } from "urql";

import { graphql } from "@/gql";
import { useResultsStore } from "@/store/resultsStore";
import { logWarning } from "@/utils/observability/log";
import {
  getLocalPlayersData,
  getLocalMainCharacterId,
} from "@/utils/results/playerData";

// `recentStandings` is capped at 20 by start.gg's schema. We were previously
// asking for only 3 events, which left a lot of players without character data
// when their first 3 tournaments had no recorded selections. 20 is the most
// we can get from one query.
const RECENT_STANDINGS_LIMIT = 20;

const PlayerFallbackCharacterQueryDoc = graphql(`
  query PlayerFallbackCharacter(
    $entrantId: ID!
    $videogameId: ID!
    $limit: Int!
  ) {
    entrant(id: $entrantId) {
      participants {
        player {
          id
          recentStandings(limit: $limit, videogameId: $videogameId) {
            entrant {
              id
              paginatedSets(
                page: 1
                perPage: 16
                sortType: RECENT
                filters: { hideEmpty: true }
              ) {
                nodes {
                  games {
                    selections {
                      entrant {
                        id
                      }
                      character {
                        id
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
  }
`);

export const useFetchPlayerFallbackCharacter = () => {
  const client = useClient();
  const dispatch = useResultsStore((state) => state.dispatch);

  const fetchFallback = async (
    entrantId: string,
    videogameId: string,
    playerId?: string,
  ) => {
    // 1. Try the better-gg snapshot first. If the player is in there, we know
    //    their main character without hitting start.gg at all — saves both a
    //    round trip and start.gg query-complexity budget.
    if (playerId) {
      try {
        const local = await getLocalPlayersData();
        const localCharId = getLocalMainCharacterId(local, playerId);
        if (localCharId) {
          dispatch({
            type: "FETCH_FALLBACK_SUCCESS",
            payload: { entrantId, characterId: localCharId },
          });
          return;
        }
      } catch {
        // Local lookup failed — fall through to start.gg.
      }
    }

    // 2. Fall back to start.gg's recentStandings aggregation.
    try {
      const result = await client
        .query(PlayerFallbackCharacterQueryDoc, {
          entrantId,
          videogameId,
          limit: RECENT_STANDINGS_LIMIT,
        })
        .toPromise();

      if (result.error || !result.data?.entrant) {
        dispatch({
          type: "FETCH_FALLBACK_SUCCESS",
          payload: { entrantId, characterId: null },
        });
        return;
      }

      const player = result.data.entrant.participants?.[0]?.player;
      if (!player) {
        dispatch({
          type: "FETCH_FALLBACK_SUCCESS",
          payload: { entrantId, characterId: null },
        });
        return;
      }

      // For each recent standing, only count selections where the selection's
      // entrant matches that standing's entrant (i.e. the player's own picks,
      // not the opponent's).
      const usage = new Map<string, number>();
      for (const standing of player.recentStandings ?? []) {
        if (!standing) continue;
        const ownEntrantId = standing.entrant?.id
          ? String(standing.entrant.id)
          : null;
        if (!ownEntrantId) continue;
        for (const node of standing.entrant?.paginatedSets?.nodes ?? []) {
          for (const game of node?.games ?? []) {
            for (const selection of game?.selections ?? []) {
              const selEntrantId = selection?.entrant?.id
                ? String(selection.entrant.id)
                : null;
              if (selEntrantId !== ownEntrantId) continue;
              const charId = selection?.character?.id
                ? String(selection.character.id)
                : null;
              if (!charId) continue;
              usage.set(charId, (usage.get(charId) ?? 0) + 1);
            }
          }
        }
      }

      let topId: string | null = null;
      let topCount = 0;
      for (const [id, count] of usage) {
        if (count > topCount) {
          topCount = count;
          topId = id;
        }
      }

      dispatch({
        type: "FETCH_FALLBACK_SUCCESS",
        payload: { entrantId, characterId: topId },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "fallback fetch failed";
      logWarning("results fallback-character fetch failed", {
        area: "results-fetch",
        entrantId,
        videogameId,
        error: message,
      });
      // Don't write null on transient errors — leave the slot empty so a later
      // attempt can refetch. (Callers can check the map's hasOwnProperty.)
    }
  };

  return { fetchFallback };
};
