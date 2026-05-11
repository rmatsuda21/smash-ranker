import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_FLAGS,
  FlagsContext,
  type FeatureFlags,
} from "@/hooks/useFeatureFlags";
import { logWarning } from "@/utils/observability/log";

const FLAGS_ENDPOINT = "/api/flags";

export const FeatureFlagsProvider = ({ children }: { children: ReactNode }) => {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);

  useEffect(() => {
    // Plain `bun dev` has no `/api/flags` handler (only `dev:vercel` does), and
    // DEFAULT_FLAGS are the intended source of truth in dev (see
    // useFeatureFlags.ts). Skip the fetch so the expected "endpoint
    // unreachable" warning doesn't fire on the happy path.
    if (import.meta.env.DEV) return;

    let cancelled = false;
    fetch(FLAGS_ENDPOINT, { credentials: "same-origin" })
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
        if (cancelled || !data) return;
        setFlags((prev) => ({ ...prev, ...data }));
      })
      .catch((error) => {
        logWarning("feature flags endpoint unreachable", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => flags, [flags]);
  return (
    <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>
  );
};
