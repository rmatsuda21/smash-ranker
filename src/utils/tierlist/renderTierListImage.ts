import { renderElementToCanvas } from "@/utils/tierlist/renderElementToCanvas";

const PIXEL_RATIO = 2;
const WATERMARK_BAND_CSS_PX = 28;
const WATERMARK_FONT_CSS_PX = 11;
const WATERMARK_FONT_FAMILY = '"M PLUS Rounded 1c", sans-serif';
const WATERMARK_FONT_WEIGHT = 500;
const WATERMARK_LETTER_SPACING_CSS_PX = 1.5;

/**
 * Paints the tier list (the live element, minus anything marked
 * `data-export-ignore`) with the site's watermark band under it, as a PNG.
 */
export const renderTierListImage = async (
  target: HTMLElement,
): Promise<Blob> => {
  // The brand font is loaded via Google Fonts globally, but it may not yet
  // be available to the canvas at the exact weight/size we need. Force it
  // to load before drawing so the text doesn't fall back to a system font.
  try {
    await document.fonts.load(
      `${WATERMARK_FONT_WEIGHT} ${WATERMARK_FONT_CSS_PX}px ${WATERMARK_FONT_FAMILY}`,
    );
  } catch {
    // Non-fatal — fallback to sans-serif if loading fails.
  }

  // A label font picked a moment ago may still be downloading.
  await document.fonts.ready;

  // Painted straight from the live layout (see renderElementToCanvas).
  // The canvas is already cropped to the non-ignored content, so an
  // empty-title placeholder doesn't leave a blank band.
  const sourceCanvas = await renderElementToCanvas(target, {
    scale: PIXEL_RATIO,
    ignore: (el) => el.hasAttribute("data-export-ignore"),
  });
  const contentPx = sourceCanvas.height;

  const bandPx = WATERMARK_BAND_CSS_PX * PIXEL_RATIO;
  const composed = document.createElement("canvas");
  composed.width = sourceCanvas.width;
  composed.height = contentPx + bandPx;
  const ctx = composed.getContext("2d")!;

  ctx.drawImage(sourceCanvas, 0, 0);

  // Watermark band: matches the prediction-graphic footer aesthetic —
  // dark gradient panel, hairline border-top, M PLUS Rounded 1c text.
  const bandTop = contentPx;
  const bandBottom = bandTop + bandPx;
  const bandGradient = ctx.createLinearGradient(0, bandTop, 0, bandBottom);
  bandGradient.addColorStop(0, "#1a1a2e");
  bandGradient.addColorStop(1, "#0f0f1a");
  ctx.fillStyle = bandGradient;
  ctx.fillRect(0, bandTop, composed.width, bandPx);

  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.fillRect(0, bandTop, composed.width, Math.max(1, PIXEL_RATIO));

  ctx.fillStyle = "#5a5a72";
  ctx.font = `${WATERMARK_FONT_WEIGHT} ${WATERMARK_FONT_CSS_PX * PIXEL_RATIO}px ${WATERMARK_FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // letterSpacing is supported in modern Chromium/Safari/Firefox.
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
    `${WATERMARK_LETTER_SPACING_CSS_PX * PIXEL_RATIO}px`;
  ctx.fillText("smash-ranker.app", composed.width / 2, bandTop + bandPx / 2);

  // Free the intermediate canvas before encoding the composed one.
  sourceCanvas.width = 0;
  sourceCanvas.height = 0;

  const blob = await new Promise<Blob>((resolve, reject) => {
    composed.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
      "image/png",
    );
  });

  composed.width = 0;
  composed.height = 0;

  return blob;
};
