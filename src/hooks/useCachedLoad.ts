import { useEffect, useRef, useState } from "react";

export type LoadStatus = "idle" | "loading" | "done" | "error";

type State<T> = { key: string | null; data: T | null; status: LoadStatus };

// Finished loads by key, kept for the page's lifetime: coming back to
// something already loaded (another event, a tab, the Back button) is instant.
const finished = new Map<string, unknown>();

// Loads whatever `key` names, once. A null key loads nothing. `data` is null
// until the load for the current key is done; a failed load can be retried by
// changing the key or remounting.
export const useCachedLoad = <T>(
  key: string | null,
  load: () => Promise<T>,
): { data: T | null; status: LoadStatus } => {
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

  useEffect(() => {
    if (key === null || finished.has(key)) return;
    let cancelled = false;
    setState({ key, data: null, status: "loading" });
    loadRef.current().then(
      (data) => {
        finished.set(key, data);
        if (!cancelled) setState({ key, data, status: "done" });
      },
      () => {
        if (!cancelled) setState({ key, data: null, status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (key === null) return { data: null, status: "idle" };
  if (finished.has(key)) {
    return { data: finished.get(key) as T, status: "done" };
  }
  // A key just switched to has nothing yet: that is loading, not idle.
  return state.key === key
    ? { data: state.data, status: state.status }
    : { data: null, status: "loading" };
};
