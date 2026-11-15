import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_FLAGS,
  FlagsContext,
  FlagsLoadingContext,
  type FeatureFlags,
} from "@/hooks/useFeatureFlags";
import { logWarning } from "@/utils/observability/log";

const FLAGS_ENDPOINT = "/api/flags";
const FLAGS_FETCH_TIMEOUT_MS = 2500;

const FORCE_LOADING_IN_DEV = true;
const shouldFetchFlags = !import.meta.env.DEV || FORCE_LOADING_IN_DEV;

export const FeatureFlagsProvider = ({ children }: { children: ReactNode }) => {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState<boolean>(shouldFetchFlags);

  useEffect(() => {
    if (!shouldFetchFlags) return;

    let settled = false;
    const controller = new AbortController();
    const finalize = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      setLoading(false);
    };

    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      controller.abort();
      logWarning("feature flags fetch timed out", {
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
            status: r.status,
          });
          return null;
        }
        return r.json();
      })
      .then((data: Partial<FeatureFlags> | null) => {
        if (settled) return;
        if (data) setFlags((prev) => ({ ...prev, ...data }));
        finalize();
      })
      .catch((error) => {
        if (settled) return;
        logWarning("feature flags endpoint unreachable", {
          error: error instanceof Error ? error.message : String(error),
        });
        finalize();
      });

    return () => {
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
