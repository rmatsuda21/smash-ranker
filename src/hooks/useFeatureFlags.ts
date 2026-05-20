import { createContext, useContext } from "react";

export type FeatureFlagKey = "thumbnail-enabled" | "results-enabled";
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const DEFAULT_FLAGS: FeatureFlags = {
  "thumbnail-enabled": import.meta.env.DEV,
  "results-enabled": import.meta.env.DEV,
};

export const FlagsContext = createContext<FeatureFlags>(DEFAULT_FLAGS);
export const FlagsLoadingContext = createContext<boolean>(false);

export const useFeatureFlag = (key: FeatureFlagKey): boolean => {
  const flags = useContext(FlagsContext);
  return Boolean(flags[key]);
};

export const useFeatureFlags = (): FeatureFlags => {
  return useContext(FlagsContext);
};

export const useFeatureFlagsLoading = (): boolean => {
  return useContext(FlagsLoadingContext);
};
