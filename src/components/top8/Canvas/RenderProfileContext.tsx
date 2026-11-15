import { createContext, useContext } from "react";

import { useExportPixelRatio } from "@/store/exportSettingsStore";
import {
  DESKTOP_PROFILE,
  computeBitmapScale,
  type RenderProfile,
} from "@/utils/top8/renderProfile";

/**
 * The profile the surrounding stage renders with. Defaults to the desktop
 * profile so standalone stages (template previews, the preview generator)
 * render at full fidelity; the mobile canvas provides `MOBILE_PROFILE`.
 */
export const RenderProfileContext =
  createContext<RenderProfile>(DESKTOP_PROFILE);

export const useRenderProfile = (): RenderProfile =>
  useContext(RenderProfileContext);

/** Bitmap density for baked images and filter caches on this stage. */
export const useBitmapScale = (): number => {
  const profile = useRenderProfile();
  const { pixelRatio } = useExportPixelRatio();
  return computeBitmapScale(profile, pixelRatio);
};
