import { isMobile } from "@/utils/isMobile";

/**
 * Every way the Top 8 render pipeline behaves differently between device
 * classes, in one place. Components read the field they care about instead of
 * asking "am I on mobile?", so a new trade-off is a new field here rather
 * than another scattered branch.
 *
 * This is about rendering cost and capability only. Whether the page uses the
 * narrow layout is a separate question answered by `isMobile()` and CSS.
 */
export type RenderProfile = {
  id: "desktop" | "mobile";

  /** Elements can be hovered, selected, dragged and transformed on canvas. */
  interactive: boolean;

  /**
   * Keep decoded full-size source images in memory so edits re-bake
   * instantly. Character art is ~15 MB decoded each, so constrained devices
   * drop the source after baking and re-read it from the HTTP cache instead.
   */
  keepSourceImages: boolean;

  /** How many recolored SVGs (flags, icons) to keep decoded. */
  recoloredSvgCacheSize: number;

  /**
   * Whether baked bitmaps must be at least as dense as the screen. False when
   * the stage is always displayed well below design size, where only the
   * export resolution matters.
   */
  bitmapsFollowScreenDensity: boolean;

  /** Pre-rasterize shadowed images so redraws skip the shadow blur. */
  cacheShadowedImages: boolean;

  filters: {
    /**
     * `"function"` runs Konva's pixel filters over `getImageData`. `"css"`
     * hands Konva a CSS filter string, which it applies natively through
     * `ctx.filter` where the browser supports it.
     */
    strategy: "function" | "css";
    /** Largest filtered element (design px²) cached on the native path.
     *  Above the cap the element renders unfiltered. */
    maxNativeArea: number;
    /** Same cap for filters that go through `getImageData`. */
    maxImageDataArea: number;
  };

  /** Render the template picker's previews live rather than showing only
   *  cached thumbnails. */
  renderTemplatePreviews: boolean;

  /** Pixel ratio of the image attached to a social post. */
  socialPixelRatio: number;

  /** Cap on the pixel ratio decoded for the on-screen export preview. */
  exportPreviewPixelRatio: number | undefined;
};

export const DESKTOP_PROFILE: RenderProfile = {
  id: "desktop",
  interactive: true,
  keepSourceImages: true,
  recoloredSvgCacheSize: 80,
  bitmapsFollowScreenDensity: true,
  cacheShadowedImages: true,
  filters: {
    strategy: "function",
    maxNativeArea: Infinity,
    maxImageDataArea: Infinity,
  },
  renderTemplatePreviews: true,
  socialPixelRatio: 2,
  exportPreviewPixelRatio: undefined,
};

export const MOBILE_PROFILE: RenderProfile = {
  id: "mobile",
  interactive: false,
  keepSourceImages: false,
  recoloredSvgCacheSize: 30,
  bitmapsFollowScreenDensity: false,
  cacheShadowedImages: false,
  filters: {
    strategy: "css",
    maxNativeArea: 30_000,
    maxImageDataArea: 20_000,
  },
  renderTemplatePreviews: false,
  // Design resolution: matches the mobile export default, so the social post
  // and the export share one cached blob.
  socialPixelRatio: 1,
  exportPreviewPixelRatio: 1,
};

let deviceProfile: RenderProfile | undefined;

/**
 * The profile for the device this page loaded on. Decided once: module-level
 * caches are sized from it, so it must not change under them on resize.
 */
export const getDeviceRenderProfile = (): RenderProfile => {
  deviceProfile ??= isMobile() ? MOBILE_PROFILE : DESKTOP_PROFILE;
  return deviceProfile;
};

const MAX_BITMAP_SCALE = 2;

/**
 * Backing pixels per design pixel for baked images and filter caches.
 *
 * These bitmaps are drawn both on screen and into exports, so they need to
 * cover whichever is denser; otherwise a 2× export from a 1× monitor upscales
 * 1× bitmaps. Capped because cost grows with the square of the scale.
 */
export const computeBitmapScale = (
  profile: RenderProfile,
  exportPixelRatio: number,
): number => {
  const screen = profile.bitmapsFollowScreenDensity
    ? window.devicePixelRatio || 1
    : 1;
  return Math.min(MAX_BITMAP_SCALE, Math.max(1, screen, exportPixelRatio));
};
