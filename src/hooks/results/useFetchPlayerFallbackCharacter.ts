import { useClient } from "urql";

import { graphql } from "@/gql";
import { useResultsStore } from "@/store/resultsStore";
import { logWarning } from "@/utils/observability/log";
import { getGameForStartggVideogame } from "@/utils/games";
import { isKnownCharacter } from "@/utils/top8/characterCatalog";
import {
  getLocalPlayersData,
  getLocalMainCharacterId,
} from "@/utils/results/playerData";

// How far back to look for a main: the player's last few events in the game,
// and their latest sets at each. Asking for start.gg's maximum of 20 events
// with 16 sets each returned over 2000 objects for an active player, more
// than the 1000 a request may return, so exactly the players with the most
// data got no character (after a 3-4 second wait). Six events of ten sets is
// around 500-700 objects and still dozens of sets with picks.
const RECENT_STANDINGS_LIMIT = 6;
const SETS_PER_STANDING = 10;
// Tried once more with this many events if the first request is still refused
// as too heavy.
const RETRY_STANDINGS_LIMIT = 3;

// Cap how long we wait for a fallback character before giving up and writing
// null ("no character"). The fallback is best-effort decoration on top of an
// already-rendered set list — letting a single slow entrant block the
// fallbacks-ready gate (and therefore the preview render) is worse than
// shipping the graphic with one missing icon.
const FALLBACK_FETCH_TIMEOUT_MS = 5000;

const PlayerFallbackCharacterQueryDoc = graphql(`
  query PlayerFallbackCharacter(
    $entrantId: ID!
    $videogameId: ID!
    $limit: Int!
    $perPage: Int!
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
                perPage: $perPage
                sortType: RECENT
                filters: { hideEmpty: true }
              ) {
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
    // (key missing entirely), which keeps the shimmer visible. Guarded by
    // `done` so the timeout race can't be undone by a late-arriving response.
    let done = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const resolve = (characterId: string | null) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      dispatch({
        type: "FETCH_FALLBACK_SUCCESS",
        payload: { entrantId, characterId },
      });
    };

    timer = setTimeout(() => {
      if (done) return;
      logWarning("results fallback-character fetch timed out", {
        area: "results-fetch",
        tournament_platform: "startgg",
        tournament_url: useResultsStore.getState().tournamentUrl,
        videogame_id: videogameId,
        entrant_id: entrantId,
        player_id: playerId,
        timeout_ms: FALLBACK_FETCH_TIMEOUT_MS,
      });
      resolve(null);
    }, FALLBACK_FETCH_TIMEOUT_MS);

    // 1. Try the better-gg snapshot first. Saves a start.gg round trip
    //    and query-complexity budget when the player is in the dataset.
    //    The snapshot holds one game's mains, so it is only read for the
    //    games the registry says it covers; for any other game it would
    //    put that game's character on this event's players.
    if (playerId && getGameForStartggVideogame(videogameId)?.hasPlayerDataset) {
      try {
        const local = await getLocalPlayersData();
        const localCharId = getLocalMainCharacterId(local, playerId);
        if (localCharId && isKnownCharacter(localCharId)) {
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
      const query = (limit: number) =>
        client
          .query(
            PlayerFallbackCharacterQueryDoc,
            {
              entrantId,
              videogameId,
              limit,
              perPage: SETS_PER_STANDING,
            },
            {
              // Who someone usually plays does not change while the page is
              // open, and is asked for again with every player picked.
              requestPolicy: "cache-first",
            },
          )
          .toPromise();

      let result = await query(RECENT_STANDINGS_LIMIT);
      if (/complexity/i.test(result.error?.message ?? "")) {
        result = await query(RETRY_STANDINGS_LIMIT);
      }

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
              const charId =
                selection?.selectionType === "CHARACTER" &&
                selection.selectionValue != null
                  ? String(selection.selectionValue)
                  : null;
              // A pick with no art (another game, Random) can't be drawn.
              if (!charId || !isKnownCharacter(charId)) continue;
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
      // slot un-keyed lets a future fetch retry. Clear the pending timer
      // too, so the retry path isn't clobbered by a stale timeout firing
      // FALLBACK_FETCH_TIMEOUT_MS later.
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };

  return { fetchFallback };
};
