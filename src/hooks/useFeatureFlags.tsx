import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type FeatureFlagKey = "thumbnail-enabled";
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

// Local-dev defaults (used until the API responds, and as a fallback when the
// /api/flags endpoint isn't reachable — e.g. running `bun dev` without
// `bun run dev:vercel`). In dev we default new features to ON so contributors
// can work on them; in production we default to OFF until the dashboard says
// otherwise.
const DEFAULT_FLAGS: FeatureFlags = {
  "thumbnail-enabled": import.meta.env.DEV,
};

const FlagsContext = createContext<FeatureFlags>(DEFAULT_FLAGS);

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

export const useFeatureFlag = (key: FeatureFlagKey): boolean => {
  const flags = useContext(FlagsContext);
  return Boolean(flags[key]);
};

export const useFeatureFlags = (): FeatureFlags => {
  return useContext(FlagsContext);
};
