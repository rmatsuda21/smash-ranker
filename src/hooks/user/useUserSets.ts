import { useEffect, useState } from "react";

import { useAuthUser } from "@/store/authStore";
import type { UserSet } from "@/types/user/UserSet";
import { fetchUserSetsPage } from "@/utils/user/fetchUserSets";
import { logWarning } from "@/utils/observability/log";

type State = {
  playerId: string | null;
  sets: UserSet[];
  status: "idle" | "loading" | "done" | "error";
};

const EMPTY: State = { playerId: null, sets: [], status: "idle" };

// The logged-in user's most recent sets (`maxPages` pages of them), fetched
// in full before anything is returned so the stats built on them do not
// shift while loading.
export const useUserSets = (maxPages: number) => {
  const playerId = useAuthUser()?.playerId ?? null;
  const [state, setState] = useState<State>(EMPTY);

  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;

    (async () => {
      setState({ playerId, sets: [], status: "loading" });
      try {
        let sets: UserSet[] = [];
        for (let page = 1; page <= maxPages; page++) {
          const result = await fetchUserSetsPage(playerId, page);
          if (cancelled) return;
          sets = [...sets, ...result.sets];
          if (page >= result.totalPages) break;
        }
        setState({ playerId, sets, status: "done" });
      } catch (err) {
        if (cancelled) return;
        logWarning("user sets fetch failed", {
          area: "user",
          error: err instanceof Error ? err.message : String(err),
        });
        setState({ playerId, sets: [], status: "error" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playerId, maxPages]);

  return state.playerId === playerId ? state : EMPTY;
};
