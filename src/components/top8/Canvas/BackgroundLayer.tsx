import { Layer } from "react-konva";
import { memo, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { useCanvasStore } from "@/store/canvasStore";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { useFontStore } from "@/store/fontStore";
import { useEffectiveCanvasSize } from "@/hooks/top8/useEffectiveCanvasSize";
import type { ElementConfig } from "@/types/top8/Design";

type Props = {
  onClick: () => void;
  onReady?: () => void;
};

const BackgroundLayerComponent = ({ onClick, onReady }: Props) => {
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const backgroundElements = useCanvasStore(
    (state) => state.design.background.elements
  );
  const colorPalette = useCanvasStore(
    useShallow((state) => state.design.colorPalette)
  );
  const bgAssetId = useCanvasStore((state) => state.design.bgAssetId);
  const bgImageDarkness = useCanvasStore(
    (state) => state.design.bgImageDarkness
  );
  const originalCanvasSize = useCanvasStore(
    useShallow((state) => state.design.canvasSize)
  );
  const effectiveCanvasSize = useEffectiveCanvasSize();
  const selectedFont = useFontStore((state) => state.selectedFont);

  const design = useMemo(
    () => ({ colorPalette, bgAssetId, bgImageDarkness }),
    [colorPalette, bgAssetId, bgImageDarkness]
  );

  const stableOnReady = useMemo(() => () => onReadyRef.current?.(), []);

  // Adjust background rects whose height matches the original canvas height
  const adjustedElements = useMemo(() => {
    if (effectiveCanvasSize.height === originalCanvasSize.height)
      return backgroundElements;
    return backgroundElements.map((el: ElementConfig) => {
      if (el.type === "rect" && el.size?.height === originalCanvasSize.height) {
        return { ...el, size: { ...el.size, height: effectiveCanvasSize.height } };
      }
      return el;
    });
  }, [backgroundElements, originalCanvasSize.height, effectiveCanvasSize.height]);

  const konvaElements = useMemo(
    () =>
      createKonvaElements(
        adjustedElements,
        {
          containerSize: effectiveCanvasSize,
          design,
          fontFamily: selectedFont,
        },
        { onAllReady: stableOnReady }
      ),
    [adjustedElements, design, effectiveCanvasSize, selectedFont, stableOnReady]
  );

  return (
    <Layer onClick={onClick} listening={false}>
      {konvaElements}
    </Layer>
  );
};

export const BackgroundLayer = memo(BackgroundLayerComponent);
