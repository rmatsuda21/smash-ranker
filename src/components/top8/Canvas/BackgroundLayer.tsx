import { Layer } from "react-konva";
import { memo, useMemo } from "react";

import { useCanvasStore } from "@/store/canvasStore";
import { createKonvaElements } from "@/utils/top8/elementFactory";

type Props = {
  onClick: () => void;
};

const BackgroundLayerComponent = ({ onClick }: Props) => {
  const layout = useCanvasStore((state) => state.layout);
  const canvasConfig = useCanvasStore((state) => state.layout.canvas);

  const backgroundElements = useMemo(
    () => layout?.background.elements || [],
    [layout?.background.elements]
  );

  const konvaElements = useMemo(
    () =>
      createKonvaElements(backgroundElements, {
        containerSize: canvasConfig.size,
        canvas: canvasConfig,
      }),
    [backgroundElements, canvasConfig]
  );

  return (
    <Layer onClick={onClick} listening={false}>
      {konvaElements}
    </Layer>
  );
};

export const BackgroundLayer = memo(BackgroundLayerComponent);
