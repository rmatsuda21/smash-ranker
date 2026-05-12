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
    // `resolve` marks the slot as fetched (writes either an id or null).
    // `null` means "fetched but no data" — distinct from "not yet fetched"
    // (key missing entirely), which keeps the shimmer visible.
    const resolve = (characterId: string | null) =>
      dispatch({
        type: "FETCH_FALLBACK_SUCCESS",
        payload: { entrantId, characterId },
      });

    // 1. Try the better-gg snapshot first. Saves a start.gg round trip
    //    and query-complexity budget when the player is in the dataset.
    if (playerId) {
      try {
        const local = await getLocalPlayersData();
        const localCharId = getLocalMainCharacterId(local, playerId);
        if (localCharId) {
          resolve(localCharId);
          return;
        }
      } catch {
        // Local lookup failed (already logged at fetch source) — fall
        // through to start.gg.
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
        resolve(null);
        return;
      }

      const player = result.data.entrant.participants?.[0]?.player;
      if (!player) {
        resolve(null);
        return;
      }

      // Count only the player's OWN selections — selections whose entrant
      // matches the recent-standing's entrant. Mixing in opponent picks
      // would skew the "main character" guess toward what the player
      // most-often faces, not what they play.
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

      resolve(topId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "fallback fetch failed";
      logWarning("results fallback-character fetch failed", {
        area: "results-fetch",
        tournament_platform: "startgg",
        tournament_url: useResultsStore.getState().tournamentUrl,
        videogame_id: videogameId,
        entrant_id: entrantId,
        player_id: playerId,
        error: message,
      });
      // Intentionally don't write null on transient errors — leaving the
      // slot un-keyed lets a future fetch retry.
    }
  };

  return { fetchFallback };
};
