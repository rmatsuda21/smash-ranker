import { useEffect, useState } from "react";

import { useAuthUser } from "@/store/authStore";
import type { UserEvent } from "@/types/user/UserEvent";
import { fetchUserEventsPage } from "@/utils/user/fetchUserEvents";
import { logWarning } from "@/utils/observability/log";

type Status = "idle" | "loading" | "done" | "error";

type State = {
  // Which user the rest of the state belongs to.
  slug: string | null;
  events: UserEvent[];
  total: number;
  status: Status;
};

const EMPTY: State = { slug: null, events: [], total: 0, status: "idle" };

// The logged-in user's events, newest first. Pages arrive one after
// another: `events` grows while `status` is "loading" and is complete (up
// to `maxPages`) at "done".
export const useUserEvents = ({
  perPage,
  maxPages,
}: {
  perPage: number;
  maxPages: number;
}) => {
  const user = useAuthUser();
  const slug = user?.slug ?? null;
  const userId = user?.id ?? null;
  const [state, setState] = useState<State>(EMPTY);

  useEffect(() => {
    if (!slug || !userId) return;
    let cancelled = false;

    (async () => {
      setState({ slug, events: [], total: 0, status: "loading" });
      try {
        let events: UserEvent[] = [];
        for (let page = 1; page <= maxPages; page++) {
          const result = await fetchUserEventsPage(
            { slug, id: userId },
            page,
            perPage,
          );
          if (cancelled) return;
          events = [...events, ...result.events];
          const isLast = page >= result.totalPages || page === maxPages;
          setState({
            slug,
            events,
            total: result.total,
            status: isLast ? "done" : "loading",
          });
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
  }, [slug, userId, perPage, maxPages]);

  // Logged out, or state left over from another account.
  return state.slug === slug ? state : EMPTY;
};
