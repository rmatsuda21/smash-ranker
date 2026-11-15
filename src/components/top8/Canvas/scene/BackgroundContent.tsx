import { memo, useMemo } from "react";

import { AssetLoadBoundary } from "@/components/top8/Canvas/AssetLoadBoundary";
import { ElementList } from "@/utils/top8/elementFactory";
import { fitBackgroundToCanvas } from "@/utils/top8/scene";
import type { Design, ElementConfig } from "@/types/top8/Design";

import {
  useSceneFactoryContext,
  type SceneDesign,
} from "@/hooks/top8/useSceneFactoryContext";

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

    const fittedElements = useMemo(
      () =>
        fitBackgroundToCanvas(
          elements,
          canvasSize.height,
          effectiveCanvasSize.height,
        ),
      [elements, canvasSize.height, effectiveCanvasSize.height],
    );

    const context = useMemo(
      () => ({
        ...factoryContext,
        containerSize: effectiveCanvasSize,
        design,
        fontFamily,
      }),
      [factoryContext, effectiveCanvasSize, design, fontFamily],
    );

    return (
      <AssetLoadBoundary onAllReady={onReady}>
        <ElementList elements={fittedElements} context={context} />
      </AssetLoadBoundary>
    );
  },
);
