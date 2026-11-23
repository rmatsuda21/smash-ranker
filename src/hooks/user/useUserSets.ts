import { useEffect, useState } from "react";

import { useAuthUser } from "@/store/authStore";
import type { UserSet } from "@/types/user/UserSet";
import { fetchUserSets } from "@/utils/user/fetchUserSets";
import { logWarning } from "@/utils/observability/log";

type State = {
  key: string | null;
  sets: UserSet[];
  status: "idle" | "loading" | "done" | "error";
};

const EMPTY: State = { key: null, sets: [], status: "idle" };

const finished = new Map<string, State>();

// The logged-in user's most recent sets (`maxPages` pages of them) from the
// given events, fetched in full before anything is returned so the stats
// built on them do not shift while loading. `eventIds` is a comma-separated
// list (a string, so it can be compared between renders): null while the
// events are not known yet, "" when there are none.
export const useUserSets = (maxPages: number, eventIds: string | null) => {
  const playerId = useAuthUser()?.playerId ?? null;
  const key = playerId && eventIds !== null ? `${playerId}:${eventIds}` : null;
  const [state, setState] = useState<State>(EMPTY);

  useEffect(() => {
    // No events means no sets, and nothing to ask start.gg for.
    if (!playerId || !key || !eventIds || finished.has(key)) return;
    let cancelled = false;

    (async () => {
      setState({ key, sets: [], status: "loading" });
      try {
        const sets = await fetchUserSets(
          playerId,
          eventIds.split(","),
          maxPages,
        );
        if (cancelled) return;
        const next: State = { key, sets, status: "done" };
        finished.set(key, next);
        setState(next);
      } catch (err) {
        if (cancelled) return;
        logWarning("user sets fetch failed", {
          area: "user",
          error: err instanceof Error ? err.message : String(err),
        });
        setState({ key, sets: [], status: "error" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playerId, key, eventIds, maxPages]);

  // The events the sets come from are still on their way.
  if (playerId && eventIds === null) {
    return { ...EMPTY, status: "loading" as const };
  }
  if (!key) return EMPTY;
  if (eventIds === "") return { ...EMPTY, key, status: "done" as const };
  return (
    finished.get(key) ??
    (state.key === key ? state : { ...EMPTY, status: "loading" as const })
  );
};
