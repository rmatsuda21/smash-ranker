import { useEffect, useState } from "react";

import { useAuthUser } from "@/store/authStore";
import { logWarning } from "@/utils/observability/log";
import {
  fetchUserGameCounts,
  type UserGameCounts,
} from "@/utils/user/fetchUserGameCounts";

type State = { slug: string; counts: UserGameCounts };

// How many events the logged-in user has in each game, or null while that
// is not known (still loading, or the request failed).
export const useUserGameCounts = (): UserGameCounts | null => {
  const slug = useAuthUser()?.slug ?? null;
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    fetchUserGameCounts(slug)
      .then((counts) => {
        if (!cancelled) setState({ slug, counts });
      })
      .catch((err: unknown) => {
        logWarning("user game counts fetch failed", {
          area: "user",
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state?.slug === slug ? state.counts : null;
};
