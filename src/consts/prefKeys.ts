// Keys for small client-side preferences stored in localStorage
// (see src/utils/prefs.ts).
export const PREF_KEYS = {
  NEEDS_TOURNAMENT_LOAD_CONFIRMATION: "needs-tournament-load-confirmation",
  LANGUAGE: "language",
  THEME: "theme",
  ACCENT_COLOR: "accent-color",
  CUSTOM_ACCENT_COLOR: "custom-accent-color",
  // Which game the profile page shows.
  PROFILE_GAME: "profile-game",
  // The feature flags the server last answered with (JSON), used when the
  // flags request is slow or fails.
  FEATURE_FLAGS: "feature-flags",
};
