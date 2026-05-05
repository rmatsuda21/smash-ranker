import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_FLAGS,
  FlagsContext,
  type FeatureFlags,
} from "@/hooks/useFeatureFlags";

const FLAGS_ENDPOINT = "/api/flags";

export const FeatureFlagsProvider = ({ children }: { children: ReactNode }) => {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);

  useEffect(() => {
    let cancelled = false;
    fetch(FLAGS_ENDPOINT, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Partial<FeatureFlags> | null) => {
        if (cancelled || !data) return;
        setFlags((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {
        // Endpoint unreachable; keep defaults.
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
