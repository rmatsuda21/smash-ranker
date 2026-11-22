import { useEffect, useState } from "react";

import { GAME_IDS } from "@/consts/games";
import { useAuthUser } from "@/store/authStore";
import type { GameId } from "@/types/Game";
import type { UserEvent } from "@/types/user/UserEvent";
import { fetchUserEventsPage } from "@/utils/user/fetchUserEvents";
import { logWarning } from "@/utils/observability/log";

type Status = "idle" | "loading" | "done" | "error";

type State = {
  // Which user and game the rest of the state belongs to.
  key: string | null;
  events: UserEvent[];
  total: number;
  status: Status;
};

const EMPTY: State = { key: null, events: [], total: 0, status: "idle" };

// Finished loads, so going back to a game already looked at is instant.
const finished = new Map<string, State>();

// The logged-in user's events, newest first: in one game, or with no `game`
// in every game the site covers (never in games it does not). Pages arrive one
// after another: `events` grows while `status` is "loading" and is complete
// (up to `maxPages`) at "done".
export const useUserEvents = ({
  game,
  perPage,
  maxPages,
}: {
  game?: GameId;
  perPage: number;
  maxPages: number;
}) => {
  const user = useAuthUser();
  const slug = user?.slug ?? null;
  const userId = user?.id ?? null;
  const key = slug ? `${slug}:${game ?? "all"}` : null;
  const [state, setState] = useState<State>(EMPTY);

  useEffect(() => {
    if (!slug || !userId || !key || finished.has(key)) return;
    let cancelled = false;

    (async () => {
      setState({ key, events: [], total: 0, status: "loading" });
      try {
        let events: UserEvent[] = [];
        for (let page = 1; page <= maxPages; page++) {
          const result = await fetchUserEventsPage(
            { slug, id: userId },
            game ? [game] : GAME_IDS,
            page,
            perPage,
          );
          if (cancelled) return;
          events = [...events, ...result.events];
          const isLast = page >= result.totalPages || page === maxPages;
          const next: State = {
            key,
            events,
            total: result.total,
            status: isLast ? "done" : "loading",
          };
          if (isLast) finished.set(key, next);
          setState(next);
          if (isLast) break;
        }
      } catch (err) {
        if (cancelled) return;
        logWarning("user events fetch failed", {
          area: "user",
          error: err instanceof Error ? err.message : String(err),
        });
        setState((prev) => ({ ...prev, status: "error" }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, userId, key, game, perPage, maxPages]);

  // Logged out.
  if (!key) return EMPTY;
  // A game just switched to has nothing yet: that is loading, not empty.
  return (
    finished.get(key) ??
    (state.key === key ? state : { ...EMPTY, status: "loading" as const })
  );
};
