import {
  assetRepository,
  customFontRepository,
  templateRepository,
  thumbnailAssetRepository,
  thumbnailTemplateRepository,
  socialTemplateRepository,
} from "@/db/repository";
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

const safe = async (step: string, fn: () => Promise<unknown> | unknown) => {
  try {
    await fn();
  } catch (err) {
    logError(err, { area: "debug-factory-reset", step });
  }
};

export const factoryReset = async (): Promise<void> => {
  await safe("localStorage", () => {
    for (const key of ZUSTAND_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  });

  await safe("templates", () => templateRepository.clear());
  await safe("assets", () => assetRepository.clear());
  await safe("customFonts", () => customFontRepository.clear());
  await safe("thumbnailTemplates", () => thumbnailTemplateRepository.clear());
  await safe("thumbnailAssets", () => thumbnailAssetRepository.clear());
  await safe("socialTemplates", () => socialTemplateRepository.clear());
  await safe("previewCache", () => previewCache.clear());

  window.location.reload();
};
