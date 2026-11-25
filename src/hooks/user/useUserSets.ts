import { useCallback, useEffect, useState } from "react";

import { useAuthUser } from "@/store/authStore";
import type { UserSet } from "@/types/user/UserSet";
import { fetchUserSets } from "@/utils/user/fetchUserSets";
import { reportLoadFailure } from "@/utils/loadError";

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
  // Bumped by `retry` to run a failed load again.
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

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
        reportLoadFailure("user sets fetch failed", err, { area: "user" });
        setState({ key, sets: [], status: "error" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playerId, key, eventIds, maxPages, attempt]);

  // The events the sets come from are still on their way.
  if (playerId && eventIds === null) {
    return { ...EMPTY, status: "loading" as const, retry };
  }
  if (!key) return { ...EMPTY, retry };
  if (eventIds === "") {
    return { ...EMPTY, key, status: "done" as const, retry };
  }
  const current =
    finished.get(key) ??
    (state.key === key ? state : { ...EMPTY, status: "loading" as const });
  return { ...current, retry };
};
