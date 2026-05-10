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
        // Endpoint unreachable (e.g. plain `bun dev` without `dev:vercel`);
        // log at warning level and keep defaults.
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
