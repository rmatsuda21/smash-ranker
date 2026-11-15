import { useCallback, useEffect, useRef } from "react";
import { Konva } from "konva/lib/Global";
import type { Stage } from "konva/lib/Stage";

import {
  applyBackingRatio,
  computeBackingRatio,
  setGlobalBackingRatio,
} from "@/utils/top8/stageBackingRatio";

type Options = {
  /** Also shrink hit canvases. Only for stages that never hit-test. */
  shrinkHitCanvases?: boolean;
};

/**
 * Sizes a stage's canvases for how large it is actually displayed.
 *
 * The stage is laid out at design size and CSS-scaled by `displayScale`, so
 * it only needs `displayScale × devicePixelRatio` backing pixels per design
 * pixel. Konva's default is the raw device pixel ratio at design size.
 *
 * Pass `null` until the scale has been measured and mount the `<Stage>` only
 * once it is known, so canvases are allocated once at the right size. Returns
 * a callback to hand the mounted stage to.
 */
export const useStageBackingRatio = (
  displayScale: number | null,
  { shrinkHitCanvases = false }: Options = {},
) => {
  const stageRef = useRef<Stage | null>(null);
  const ratio =
    displayScale === null ? null : computeBackingRatio(displayScale);
  const ratioRef = useRef(ratio);
  ratioRef.current = ratio;

  // Konva has no per-stage pixel ratio: layers read this global when they
  // create their canvases, which happens while the Stage's children mount.
  // It therefore has to be in place during render, before any effect runs.
  if (ratio !== null && Konva.pixelRatio !== ratio) {
    setGlobalBackingRatio(ratio);
  }

  // Put the global back on unmount so other Konva surfaces (e.g. /thumbnail)
  // get the default again. The setup half re-asserts the ratio because
  // StrictMode runs this cleanup once on a component that keeps rendering.
  useEffect(() => {
    if (ratioRef.current !== null) setGlobalBackingRatio(ratioRef.current);
    return () => {
      setGlobalBackingRatio(window.devicePixelRatio || 1);
    };
  }, []);

  // Resize the canvases of an already-mounted stage when the scale changes.
  useEffect(() => {
    if (ratio !== null && stageRef.current) {
      applyBackingRatio(stageRef.current, ratio, { shrinkHitCanvases });
    }
  }, [ratio, shrinkHitCanvases]);

  return useCallback(
    (stage: Stage | null) => {
      stageRef.current = stage;
      if (stage && ratioRef.current !== null) {
        applyBackingRatio(stage, ratioRef.current, { shrinkHitCanvases });
      }
    },
    [shrinkHitCanvases],
  );
};
