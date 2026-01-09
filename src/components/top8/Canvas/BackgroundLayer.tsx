import { Layer } from "react-konva";
import { memo, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { useCanvasStore } from "@/store/canvasStore";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { useFontStore } from "@/store/fontStore";

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
  const canvasSize = useCanvasStore(
    useShallow((state) => state.design.canvasSize)
  );
  const selectedFont = useFontStore((state) => state.selectedFont);

  const design = useMemo(
    () => ({ colorPalette, bgAssetId }),
    [colorPalette, bgAssetId]
  );

  const stableOnReady = useMemo(() => () => onReadyRef.current?.(), []);

  const konvaElements = useMemo(
    () =>
      createKonvaElements(
        backgroundElements,
        {
          containerSize: canvasSize,
          design,
          fontFamily: selectedFont,
        },
        { onAllReady: stableOnReady }
      ),
    [backgroundElements, design, canvasSize, selectedFont, stableOnReady]
  );

  return (
    <Layer onClick={onClick} listening={false}>
      {konvaElements}
    </Layer>
  );
};

export const BackgroundLayer = memo(BackgroundLayerComponent);
