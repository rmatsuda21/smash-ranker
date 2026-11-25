import { useEffect, useState } from "react";

import { useAuthUser } from "@/store/authStore";
import { reportLoadFailure } from "@/utils/loadError";
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
        reportLoadFailure("user game counts fetch failed", err, {
          area: "user",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state?.slug === slug ? state.counts : null;
};
