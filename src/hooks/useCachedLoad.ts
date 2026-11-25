import { useCallback, useEffect, useRef, useState } from "react";

import { logEvent } from "@/utils/observability/log";
import { reportLoadFailure } from "@/utils/loadError";

export type LoadStatus = "idle" | "loading" | "done" | "error";

type State<T> = { key: string | null; data: T | null; status: LoadStatus };

// Finished loads by key, kept for the page's lifetime: coming back to
// something already loaded (another event, a tab, the Back button) is instant.
const finished = new Map<string, unknown>();

// Loads whatever `key` names, once. A null key loads nothing. `data` is null
// until the load for the current key is done. A failed load is never kept:
// `retry` runs it again. `label` names the load in the failure report (the
// part of the key before the first colon when left out).
export const useCachedLoad = <T>(
  key: string | null,
  load: () => Promise<T>,
  label?: string,
): { data: T | null; status: LoadStatus; retry: () => void } => {
  const [state, setState] = useState<State<T>>({
    key: null,
    data: null,
    status: "idle",
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

  useEffect(() => {
    if (key === null || finished.has(key)) return;
    let cancelled = false;
    setState({ key, data: null, status: "loading" });
    loadRef.current().then(
      (data) => {
        finished.set(key, data);
        if (!cancelled) setState({ key, data, status: "done" });
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
        if (!cancelled) setState({ key, data: null, status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  if (key === null) return { data: null, status: "idle", retry };
  if (finished.has(key)) {
    return { data: finished.get(key) as T, status: "done", retry };
  }
  // A key just switched to has nothing yet: that is loading, not idle.
  return state.key === key
    ? { data: state.data, status: state.status, retry }
    : { data: null, status: "loading", retry };
};
