import { createContext, useContext } from "react";

export type FeatureFlagKey = "thumbnail-enabled";
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

// Local-dev defaults (used until the API responds, and as a fallback when the
// /api/flags endpoint isn't reachable — e.g. running `bun dev` without
// `bun run dev:vercel`). In dev we default new features to ON so contributors
// can work on them; in production we default to OFF until the dashboard says
// otherwise.
export const DEFAULT_FLAGS: FeatureFlags = {
  "thumbnail-enabled": import.meta.env.DEV,
};

export const FlagsContext = createContext<FeatureFlags>(DEFAULT_FLAGS);

export const useFeatureFlag = (key: FeatureFlagKey): boolean => {
  const flags = useContext(FlagsContext);
  return Boolean(flags[key]);
};

export const useFeatureFlags = (): FeatureFlags => {
  return useContext(FlagsContext);
};
