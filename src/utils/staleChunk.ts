// A page chunk that fails to load almost always means the site was deployed
// while this tab was open: the file names it knows are gone. Reloading picks
// up the new ones. One reload only, so a visitor who is simply offline is not
// sent round in a loop.

const RELOAD_KEY = "smash-ranker:chunk-reload-at";
const RELOAD_COOLDOWN_MS = 60_000;

const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Unable to preload CSS/i,
  /is not a valid JavaScript MIME type/i,
];

export const isChunkLoadError = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};

// Reloads the page unless it already did so a moment ago. Returns whether a
// reload is on its way, so the caller can skip drawing an error.
export const reloadForStaleChunk = (): boolean => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Without session storage there is no way to tell a second attempt from
    // a first one: show the error instead of risking a loop.
    return false;
  }
  window.location.reload();
  return true;
};
