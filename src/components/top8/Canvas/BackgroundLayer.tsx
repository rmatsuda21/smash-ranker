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
    (state) => state.layout.background.elements
  );
  const canvasConfig = useCanvasStore((state) => state.layout.canvas);
  const selectedFont = useFontStore((state) => state.selectedFont);

  const konvaElements = useMemo(
    () =>
      createKonvaElements(backgroundElements, {
        containerSize: canvasConfig.size,
        canvas: canvasConfig,
        fontFamily: selectedFont,
      }),
    [backgroundElements, canvasConfig, selectedFont]
  );

  return (
    <Layer onClick={onClick} listening={false}>
      {konvaElements}
    </Layer>
  );
};

export const BackgroundLayer = memo(BackgroundLayerComponent);
