import { Layer } from "react-konva";
import { memo, useMemo } from "react";

import { useCanvasStore } from "@/store/canvasStore";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { useFontStore } from "@/store/fontStore";

type Props = {
  onClick: () => void;
};

const BackgroundLayerComponent = ({ onClick }: Props) => {
  const backgroundElements = useCanvasStore(
    (state) => state.design.background.elements
  );
  const colorPalette = useCanvasStore((state) => state.design.colorPalette);
  const bgAssetId = useCanvasStore((state) => state.design.bgAssetId);
  const canvasSize = useCanvasStore((state) => state.design.canvasSize);
  const selectedFont = useFontStore((state) => state.selectedFont);

  const konvaElements = useMemo(
    () =>
      createKonvaElements(backgroundElements, {
        containerSize: canvasSize,
        design: { colorPalette, bgAssetId },
        fontFamily: selectedFont,
      }),
    [backgroundElements, colorPalette, bgAssetId, canvasSize, selectedFont]
  );

  return (
    <Layer onClick={onClick} listening={false}>
      {konvaElements}
    </Layer>
  );
};

export const BackgroundLayer = memo(BackgroundLayerComponent);
