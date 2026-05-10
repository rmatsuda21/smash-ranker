// Stable anonymous client UUID, persisted in localStorage. Used as PostHog's
// `distinct_id` so a returning visitor's events accumulate against the same
// person profile (enables cohort analysis, person properties, etc.).
//
// PostHog itself also persists a UUID in localStorage by default. We mirror
// it under our own key so we control the lifecycle and so the same id is
// available before posthog.init() runs.

const STORAGE_KEY = "smash-ranker:client-id";

export const getClientId = (): string => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage may be unavailable (Safari private mode, blocked storage).
    // Fall back to a per-load random id; analytics still works, just without
    // cross-session continuity.
    return `ephemeral-${Math.random().toString(36).slice(2)}`;
  }
};
