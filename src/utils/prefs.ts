// Small client-only preferences (theme, language, accent, "don't show
// again"), kept in localStorage so they stay on the device. Keys live in
// src/consts/prefKeys.ts.

const PREFIX = "smash-ranker:pref:";

export const getPref = (key: string): string | undefined => {
  try {
    return localStorage.getItem(PREFIX + key) ?? undefined;
  } catch {
    // Storage can be unavailable (private mode, blocked).
    return undefined;
  }
};

export const setPref = (key: string, value: string): void => {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // The preference simply doesn't persist past this page load.
  }
};
