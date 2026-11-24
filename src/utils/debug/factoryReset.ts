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

const ZUSTAND_STORAGE_KEYS = [
  "canvas-store",
  "player-store",
  "prediction-store",
  "results-store",
  "social-post-store",
  "thumbnail-store",
  "thumbnail-maker",
  "tier-list-store",
  "tournament-store",
  "export-settings",
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
