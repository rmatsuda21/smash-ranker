import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const PIXEL_RATIO_MIN = 0.5;
export const PIXEL_RATIO_MAX = 4;
export const PIXEL_RATIO_MAX_MOBILE = 2;
export const PIXEL_RATIO_STEP = 0.5;
export const PIXEL_RATIO_DEFAULT = 2;

export const QUALITY_MIN = 0.1;
export const QUALITY_MAX = 1;
export const QUALITY_STEP = 0.1;
/** 90% — high quality with mild compression. Aligned to QUALITY_STEP so
 *  the slider thumb lands on a snap point. */
export const QUALITY_DEFAULT = 0.9;

const clampNumber = (
  next: number,
  fallback: number,
  min: number,
  max: number,
): number => {
  if (!Number.isFinite(next)) return fallback;
  if (next < min) return min;
  if (next > max) return max;
  return next;
};

interface ExportSettingsState {
  pixelRatio: number;
  quality: number;
  setPixelRatio: (value: number) => void;
  setQuality: (value: number) => void;
}

export const useExportSettingsStore = create<ExportSettingsState>()(
  persist(
    (set, get) => ({
      pixelRatio: PIXEL_RATIO_DEFAULT,
      quality: QUALITY_DEFAULT,
      setPixelRatio: (value) =>
        set({
          pixelRatio: clampNumber(
            value,
            get().pixelRatio,
            PIXEL_RATIO_MIN,
            PIXEL_RATIO_MAX,
          ),
        }),
      setQuality: (value) =>
        set({
          quality: clampNumber(value, get().quality, QUALITY_MIN, QUALITY_MAX),
        }),
    }),
    {
      name: "export-settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Defensive: localStorage values can be corrupted or come from older
      // builds where defaults were nonsense (e.g. quality=2). Re-clamp on
      // rehydrate so persisted state is always valid.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.pixelRatio = clampNumber(
          state.pixelRatio,
          PIXEL_RATIO_DEFAULT,
          PIXEL_RATIO_MIN,
          PIXEL_RATIO_MAX,
        );
        state.quality = clampNumber(
          state.quality,
          QUALITY_DEFAULT,
          QUALITY_MIN,
          QUALITY_MAX,
        );
      },
    },
  ),
);
