import { useCallback, useEffect, useRef, useState } from "react";

import { LIVE_MAX_AGE_MS } from "@/consts/live";
import { logEvent } from "@/utils/observability/log";
import { LoadError, reportLoadFailure } from "@/utils/loadError";

export type LoadStatus = "idle" | "loading" | "done" | "error";

type State<T> = {
  key: string | null;
  data: T | null;
  status: LoadStatus;
  // Why the load failed, in words for the user, when the failure knows
  // (start.gg over its request limit, an outage). Null otherwise.
  message: string | null;
};

// Finished loads by key, kept for the page's lifetime: coming back to
// something already loaded (another event, a tab, the Back button) is instant.
const finished = new Map<string, { data: unknown; at: number }>();

// Loads whatever `key` names, once. A null key loads nothing. `data` is null
// until the load for the current key is done. A failed load is never kept:
// `retry` runs it again. `label` names the load in the failure report (the
// part of the key before the first colon when left out). `mayChange` says
// whether data is of something not finished: it is then loaded again in the
// background when it is come back to (a tab, an event, the browser window)
// after a minute, and stays on screen meanwhile.
export const useCachedLoad = <T>(
  key: string | null,
  load: () => Promise<T>,
  {
    label,
    mayChange,
  }: { label?: string; mayChange?: (data: T) => boolean } = {},
): {
  data: T | null;
  status: LoadStatus;
  message: string | null;
  retry: () => void;
} => {
  const [state, setState] = useState<State<T>>({
    key: null,
    data: null,
    status: "idle",
    message: null,
  });
  // The loader closes over whatever the key was built from; only a new key
  // starts a load.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  // Bumped by `retry` to run a failed load again.
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const labelRef = useRef(label);
  useEffect(() => {
    labelRef.current = label;
  });
  const mayChangeRef = useRef(mayChange);
  useEffect(() => {
    mayChangeRef.current = mayChange;
  });

  // Bumped when the window is come back to.
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    if (key === null) return;
    const onVisibility = () => {
      // A first load still on its way is left alone.
      if (document.visibilityState === "visible" && finished.has(key)) {
        setVisit((n) => n + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [key]);

  useEffect(() => {
    if (key === null) return;
    const held = finished.get(key);
    if (held) {
      const isStale =
        Date.now() - held.at > LIVE_MAX_AGE_MS &&
        mayChangeRef.current?.(held.data as T);
      if (!isStale) return;
    }
    let cancelled = false;
    if (!held) setState({ key, data: null, status: "loading", message: null });
    loadRef.current().then(
      (data) => {
        finished.set(key, { data, at: Date.now() });
        if (!cancelled) setState({ key, data, status: "done", message: null });
      },
      (error: unknown) => {
        // Reported whether or not anyone is still looking: a failure is a
        // failure. User-input ones (no such tournament) stay out of Sentry.
        const stage = labelRef.current ?? key.split(":")[0];
        const failureKind = reportLoadFailure(`${stage} load failed`, error, {
          area: "cached-load",
          key,
        });
        logEvent("tournament_page_fail", { stage, failure_kind: failureKind });
        // A refresh that failed leaves what was there.
        if (!cancelled && !held) {
          setState({
            key,
            data: null,
            status: "error",
            message: error instanceof LoadError ? error.message : null,
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, attempt, visit]);

  if (key === null) {
    return { data: null, status: "idle", message: null, retry };
  }
  const held = finished.get(key);
  if (held) {
    return { data: held.data as T, status: "done", message: null, retry };
  }
  // A key just switched to has nothing yet: that is loading, not idle.
  return state.key === key
    ? {
        data: state.data,
        status: state.status,
        message: state.message,
        retry,
      }
    : { data: null, status: "loading", message: null, retry };
};
