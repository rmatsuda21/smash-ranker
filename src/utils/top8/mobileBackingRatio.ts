import { Konva } from "konva/lib/Global";
import type { Layer } from "konva/lib/Layer";
import type { Stage } from "konva/lib/Stage";

/** Floor so a very narrow container can't make the graphic unreadably soft. */
const MIN_BACKING_RATIO = 0.25;

/** Round up to this step so sub-pixel layout jitter doesn't reallocate. */
const BACKING_RATIO_STEP = 0.05;

/** The mobile stage never hit-tests (`listening={false}`), but Konva still
 *  allocates a stage-sized hit canvas per layer. Shrink it to a token size. */
const HIT_CANVAS_RATIO = 0.05;

/**
 * Backing-store ratio for the on-screen mobile stage.
 *
 * The stage is laid out at design size (e.g. 1920×1080) and CSS-scaled down
 * to the container, so the canvas only needs `displayScale × devicePixelRatio`
 * backing pixels per design pixel to look sharp. Konva's default is the raw
 * devicePixelRatio, which on a DPR-3 phone means a 5760×3240 canvas per layer.
 */
export const computeBackingRatio = (displayScale: number): number => {
  const dpr = window.devicePixelRatio || 1;
  const raw = displayScale * dpr;
  const stepped = Math.ceil(raw / BACKING_RATIO_STEP) * BACKING_RATIO_STEP;
  return Math.min(dpr, Math.max(MIN_BACKING_RATIO, stepped));
};

/**
 * Konva reads this global when it creates layer / buffer canvases; a `Stage`
 * has no per-instance pixelRatio. Set it before the stage mounts. Returns the
 * previous value so the caller can restore it on unmount.
 */
export const setGlobalBackingRatio = (ratio: number): number => {
  const previous = Konva.pixelRatio;
  Konva.pixelRatio = ratio;
  return previous;
};

export const shrinkHitCanvas = (layer: Layer): void => {
  const hit = layer.getHitCanvas();
  if (hit.getPixelRatio() !== HIT_CANVAS_RATIO) {
    hit.setPixelRatio(HIT_CANVAS_RATIO);
  }
};

/** Re-applies the ratio to an already-mounted stage (container resize,
 *  rotation). Exports are unaffected: they render at their own ratio. */
export const applyBackingRatio = (stage: Stage, ratio: number): void => {
  if (stage.bufferCanvas.getPixelRatio() !== ratio) {
    stage.bufferCanvas.setPixelRatio(ratio);
  }
  if (stage.bufferHitCanvas.getPixelRatio() !== HIT_CANVAS_RATIO) {
    stage.bufferHitCanvas.setPixelRatio(HIT_CANVAS_RATIO);
  }
  for (const layer of stage.getLayers()) {
    shrinkHitCanvas(layer);
    const scene = layer.getCanvas();
    if (scene.getPixelRatio() !== ratio) {
      scene.setPixelRatio(ratio);
      layer.batchDraw();
    }
  }
};
