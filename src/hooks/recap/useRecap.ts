import { useEffect, useState } from "react";

import type { GameId } from "@/types/Game";
import type { Recap, RecapPlayer } from "@/types/recap/Recap";
import { logWarning } from "@/utils/observability/log";
import { computeRecap } from "@/utils/recap/computeRecap";
import { fetchRecapEvents } from "@/utils/recap/fetchRecapEvents";
import { fetchRecapSets } from "@/utils/recap/fetchRecapSets";
import { isKnownCharacter } from "@/utils/top8/characterCatalog";

export type RecapState = {
  status: "idle" | "loading" | "done" | "error";
  // 0–1 while loading.
  progress: number;
  recap: Recap | null;
};

const IDLE: RecapState = { status: "idle", progress: 0, recap: null };
// Events are one or two requests; the sets are the long part.
const EVENTS_SHARE = 0.15;

// Finished recaps, so leaving and coming back does not fetch a year again.
const finished = new Map<string, Recap>();

// One player's year in one game: every event and set, turned into the stats
// the story shows.
export const useRecap = (
  player: RecapPlayer | null,
  game: GameId,
  year: number,
): RecapState => {
  const key = player ? `${player.slug}:${game}:${year}` : null;
  const [state, setState] = useState<{ key: string } & RecapState>();

  useEffect(() => {
    if (!player || !key || finished.has(key)) return;
    let cancelled = false;
    const update = (next: RecapState) => {
      if (!cancelled) setState({ key, ...next });
    };

    (async () => {
      update({ status: "loading", progress: 0, recap: null });
      try {
        const events = await fetchRecapEvents(player, game, year);
        update({ status: "loading", progress: EVENTS_SHARE, recap: null });
        const sets = await fetchRecapSets(player.playerId, events, (done) =>
          update({
            status: "loading",
            progress: EVENTS_SHARE + done * (1 - EVENTS_SHARE),
            recap: null,
          }),
        );
        const recap = computeRecap(
          player,
          year,
          events,
          sets,
          isKnownCharacter,
        );
        finished.set(key, recap);
        update({ status: "done", progress: 1, recap });
      } catch (err) {
        logWarning("recap fetch failed", {
          area: "recap",
          error: err instanceof Error ? err.message : String(err),
        });
        update({ status: "error", progress: 0, recap: null });
      }
    })();

    return () => {
      cancelled = true;
    };
    // `key` stands for the player, the game and the year.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!key) return IDLE;
  const done = finished.get(key);
  if (done) return { status: "done", progress: 1, recap: done };
  return state?.key === key
    ? state
    : { status: "loading", progress: 0, recap: null };
};
