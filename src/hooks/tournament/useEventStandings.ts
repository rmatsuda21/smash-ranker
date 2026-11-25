import { useCallback, useEffect, useReducer, useRef } from "react";

import type { LoadStatus } from "@/hooks/useCachedLoad";
import type { StandingEntry } from "@/types/tournament/Tournament";
import { reportLoadFailure } from "@/utils/loadError";
import { logEvent } from "@/utils/observability/log";
import { fetchEventStandings } from "@/utils/tournament/fetchEvent";

type Loaded = {
  standings: StandingEntry[];
  total: number;
  totalPages: number;
  pages: number;
  status: LoadStatus;
};

// Pages loaded so far, per event, kept so a return to the tab is instant.
const loaded = new Map<string, Loaded>();

const EMPTY: Loaded = {
  standings: [],
  total: 0,
  totalPages: 1,
  pages: 0,
  status: "idle",
};

// An event's placements, a page at a time: the first page loads on its own,
// the rest when `loadMore` is called.
export const useEventStandings = (eventId: string | null) => {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (!eventId) return;
    const current = loaded.get(eventId) ?? EMPTY;
    if (current.status === "loading" || current.pages >= current.totalPages) {
      return;
    }
    loaded.set(eventId, { ...current, status: "loading" });
    rerender();
    try {
      const page = await fetchEventStandings(eventId, current.pages + 1);
      loaded.set(eventId, {
        standings: [...current.standings, ...page.standings],
        total: page.total,
        totalPages: page.totalPages,
        pages: current.pages + 1,
        status: "done",
      });
    } catch (error) {
      // What had loaded stays; calling `loadMore` again asks for the same
      // page.
      loaded.set(eventId, { ...current, status: "error" });
      const failureKind = reportLoadFailure(
        "event-standings load failed",
        error,
        { area: "cached-load", eventId, page: current.pages + 1 },
      );
      logEvent("tournament_page_fail", {
        stage: "event-standings",
        failure_kind: failureKind,
      });
    }
    if (mounted.current) rerender();
  }, [eventId]);

  useEffect(() => {
    if (eventId && !loaded.has(eventId)) void loadMore();
  }, [eventId, loadMore]);

  const state = (eventId && loaded.get(eventId)) || EMPTY;
  return {
    ...state,
    hasMore: state.pages > 0 && state.pages < state.totalPages,
    loadMore,
  };
};
