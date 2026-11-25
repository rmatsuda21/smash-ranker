import { useCallback, useEffect, useReducer, useRef } from "react";

import { LIVE_MAX_AGE_MS } from "@/consts/live";
import type { LoadStatus } from "@/hooks/useCachedLoad";
import type {
  StandingEntry,
  TournamentEvent,
} from "@/types/tournament/Tournament";
import { reportLoadFailure } from "@/utils/loadError";
import { logEvent } from "@/utils/observability/log";
import { fetchEventStandings } from "@/utils/tournament/fetchEvent";

type Loaded = {
  standings: StandingEntry[];
  total: number;
  totalPages: number;
  pages: number;
  // When the pages were read.
  at: number;
  status: LoadStatus;
};

// Pages loaded so far, per event, kept so a return to the tab is instant.
const loaded = new Map<string, Loaded>();

const EMPTY: Loaded = {
  standings: [],
  total: 0,
  totalPages: 1,
  pages: 0,
  at: 0,
  status: "idle",
};

// An event's placements, a page at a time: the first page loads on its own,
// the rest when `loadMore` is called. An event still being played has the
// pages it shows read again when it is come back to after a minute.
export const useEventStandings = (event: TournamentEvent) => {
  const eventId = event.id;
  const isFinished = event.status === "finished";
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadMore = useCallback(async () => {
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
        at: current.at || Date.now(),
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

  const refresh = useCallback(async () => {
    const current = loaded.get(eventId);
    if (!current || current.status !== "done") return;
    if (isFinished || Date.now() - current.at <= LIVE_MAX_AGE_MS) return;
    // Marked as read now, so coming back again meanwhile asks once.
    loaded.set(eventId, { ...current, at: Date.now() });
    try {
      const pages = await Promise.all(
        Array.from({ length: current.pages }, (_, index) =>
          fetchEventStandings(eventId, index + 1),
        ),
      );
      // "Load more" pressed meanwhile: its page joins the list as it was, and
      // the next visit reads it all again.
      const latest = loaded.get(eventId);
      if (latest?.pages !== current.pages || latest.status !== "done") return;
      // Someone who moved between pages while they were read is listed once.
      const byEntrant = new Map<string, StandingEntry>();
      for (const entry of pages.flatMap((page) => page.standings)) {
        if (!byEntrant.has(entry.entrantId)) {
          byEntrant.set(entry.entrantId, entry);
        }
      }
      const [first] = pages;
      loaded.set(eventId, {
        ...latest,
        standings: [...byEntrant.values()],
        total: first.total,
        totalPages: first.totalPages,
      });
    } catch (error) {
      // What was there stays.
      reportLoadFailure("event-standings refresh failed", error, {
        area: "cached-load",
        eventId,
      });
    }
    if (mounted.current) rerender();
  }, [eventId, isFinished]);

  useEffect(() => {
    if (loaded.has(eventId)) void refresh();
    else void loadMore();

    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [eventId, loadMore, refresh]);

  const state = loaded.get(eventId) ?? EMPTY;
  return {
    ...state,
    hasMore: state.pages > 0 && state.pages < state.totalPages,
    loadMore,
  };
};
