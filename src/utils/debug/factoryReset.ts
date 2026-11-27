import { clearAllStores, deleteDatabase } from "@/db/indexDB";
import { previewCache } from "@/db/previewCache";
import { logError } from "@/utils/observability/log";

// Every persisted store's `name` in src/store/, plus the keys of stores
// that no longer exist. A store added without its key here survives a
// reset, and a reset is the way out of a crash caused by saved state.
const ZUSTAND_STORAGE_KEYS = [
  "auth-store",
  "canvas-store",
  "export-settings",
  "player-store",
  "prediction-store",
  "results-store",
  "social-post-store-v1",
  "template-favorites",
  "thumbnail-maker",
  "tier-list-store",
  "tournament-store",
  // Legacy.
  "social-post-store",
  "thumbnail-store",
];

// How long a step may wait on another tab that keeps a database open. The
// reset must end in a reload either way.
const STEP_TIMEOUT_MS = 3000;

const withTimeout = <T>(step: string, work: Promise<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`${step} timed out`)),
      STEP_TIMEOUT_MS,
    );
    work.then(resolve, reject).finally(() => clearTimeout(timeout));
  });

const safe = async (step: string, fn: () => Promise<unknown> | unknown) => {
  try {
    await fn();
  } catch (err) {
    logError(err, { area: "debug-factory-reset", step });
  }
};

// Empties a database, and deletes it only when that fails. Emptying works
// while another tab keeps the database open. Deleting needs no working
// connection, so it is the way out when the database can no longer be
// opened or has lost a store, which is when a reset is needed most; but a
// delete that another tab holds up keeps every later open waiting behind
// it, in this tab too, so it is not the first thing tried.
const emptyOrDelete = async (
  name: string,
  empty: () => Promise<void>,
  remove: () => Promise<void>,
) => {
  try {
    await withTimeout(`${name}.clear`, empty());
  } catch (err) {
    logError(err, { area: "debug-factory-reset", step: `${name}.clear` });
    await safe(`${name}.delete`, () => withTimeout(`${name}.delete`, remove()));
  }
};

export const factoryReset = async (): Promise<void> => {
  await safe("localStorage", () => {
    for (const key of ZUSTAND_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  });

  await emptyOrDelete("database", clearAllStores, deleteDatabase);
  await emptyOrDelete("previewCache", previewCache.clear, previewCache.destroy);

  window.location.reload();
};
