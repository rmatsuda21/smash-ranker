import { memo, useMemo } from "react";

import { createKonvaElements } from "@/utils/top8/elementFactory";
import { fitBackgroundToCanvas } from "@/utils/top8/scene";
import type { Design, ElementConfig } from "@/types/top8/Design";

import {
  useLatestCallback,
  useSceneFactoryContext,
  type SceneDesign,
} from "./useSceneFactoryContext";

type Props = {
  elements: ElementConfig[];
  /** The design's own canvas size. */
  canvasSize: Design["canvasSize"];
  /** Canvas size after dynamic player height; full-height rects stretch
   *  to it. */
  effectiveCanvasSize: Design["canvasSize"];
  design: SceneDesign;
  fontFamily: string;
  onReady?: () => void;
};

/** The design's background elements. Renders bare nodes; the caller decides
 *  which layer or group they live in. */
export const BackgroundContent = memo(
  ({
    elements,
    canvasSize,
    effectiveCanvasSize,
    design,
    fontFamily,
    onReady,
  }: Props) => {
    const factoryContext = useSceneFactoryContext();
    const handleReady = useLatestCallback(onReady);

    const fittedElements = useMemo(
      () =>
        fitBackgroundToCanvas(
          elements,
          canvasSize.height,
          effectiveCanvasSize.height,
        ),
      [elements, canvasSize.height, effectiveCanvasSize.height],
    );

    return useMemo(
      () =>
        createKonvaElements(
          fittedElements,
          {
            ...factoryContext,
            containerSize: effectiveCanvasSize,
            design,
            fontFamily,
          },
          { onAllReady: handleReady },
        ),
      [
        fittedElements,
        factoryContext,
        effectiveCanvasSize,
        design,
        fontFamily,
        handleReady,
      ],
    );
  },
);
