import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_FLAGS,
  FlagsContext,
  FlagsLoadingContext,
  type FeatureFlags,
} from "@/hooks/useFeatureFlags";
import { PREF_KEYS } from "@/consts/prefKeys";
import { logWarning } from "@/utils/observability/log";
import { requestIdOf } from "@/utils/observability/requestId";
import { getPref, setPref } from "@/utils/prefs";

const FLAGS_ENDPOINT = "/api/flags";
const FLAGS_FETCH_TIMEOUT_MS = 2500;

const FORCE_LOADING_IN_DEV = true;
const shouldFetchFlags = !import.meta.env.DEV || FORCE_LOADING_IN_DEV;

// Only known keys with boolean values are taken from a response or from
// storage, so neither can put anything else into the flags.
const pickFlags = (data: unknown): Partial<FeatureFlags> => {
  const out: Partial<FeatureFlags> = {};
  if (!data || typeof data !== "object") return out;
  for (const key of Object.keys(DEFAULT_FLAGS) as (keyof FeatureFlags)[]) {
    const value = (data as Record<string, unknown>)[key];
    if (typeof value === "boolean") out[key] = value;
  }
  return out;
};

// What the server said last time. Without this, a slow or failed request
// would switch every flagged tool off for the visit.
const readRememberedFlags = (): Partial<FeatureFlags> => {
  try {
    return pickFlags(JSON.parse(getPref(PREF_KEYS.FEATURE_FLAGS) ?? "null"));
  } catch {
    return {};
  }
};

export const FeatureFlagsProvider = ({ children }: { children: ReactNode }) => {
  const [flags, setFlags] = useState<FeatureFlags>(() => ({
    ...DEFAULT_FLAGS,
    ...(shouldFetchFlags ? readRememberedFlags() : {}),
  }));
  const [loading, setLoading] = useState<boolean>(shouldFetchFlags);

  useEffect(() => {
    if (!shouldFetchFlags) return;

    let settled = false;
    let unmounted = false;
    const controller = new AbortController();
    const finalize = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      setLoading(false);
    };

    // The app stops waiting here and opens with the remembered flags; the
    // request carries on, and its answer is applied and remembered when it
    // comes.
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      logWarning("feature flags fetch timed out", {
        area: "flags",
        timeoutMs: FLAGS_FETCH_TIMEOUT_MS,
      });
      finalize();
    }, FLAGS_FETCH_TIMEOUT_MS);

    fetch(FLAGS_ENDPOINT, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) {
          logWarning("feature flags endpoint returned non-OK", {
            area: "flags",
            status: r.status,
            request_id: requestIdOf(r),
          });
          return null;
        }
        // The function could not read the dashboard and sent its defaults
        // (everything off): what this browser remembers is the better guess.
        // The function reports this itself, once per instance.
        if (r.headers.get("x-flags-fallback")) return null;
        return r.json();
      })
      .then((data: unknown) => {
        if (unmounted) return;
        const received = pickFlags(data);
        if (Object.keys(received).length > 0) {
          setFlags((prev) => ({ ...prev, ...received }));
          setPref(PREF_KEYS.FEATURE_FLAGS, JSON.stringify(received));
        }
        finalize();
      })
      .catch((error) => {
        if (unmounted || settled) return;
        logWarning("feature flags endpoint unreachable", {
          area: "flags",
          error: error instanceof Error ? error.message : String(error),
        });
        finalize();
      });

    return () => {
      unmounted = true;
      settled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const flagsValue = useMemo(() => flags, [flags]);

  return (
    <FlagsContext value={flagsValue}>
      <FlagsLoadingContext value={loading}>{children}</FlagsLoadingContext>
    </FlagsContext>
  );
};
