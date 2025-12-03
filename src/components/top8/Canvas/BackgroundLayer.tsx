import { Layer } from "react-konva";
import { memo, useMemo } from "react";

import { useCanvasStore } from "@/store/canvasStore";
import { createKonvaElements } from "@/utils/top8/elementFactory";

type Props = {
  onClick: () => void;
};

const BackgroundLayerComponent = ({ onClick }: Props) => {
  const layout = useCanvasStore((state) => state.layout);
  const cavnasConfig = useCanvasStore((state) => state.layout.canvas);

  const backgroundElements = useMemo(
    () => layout?.background.elements || [],
    [layout?.background.elements]
  );

  const konvaElements = useMemo(
    () =>
      createKonvaElements(backgroundElements, {
        containerSize: cavnasConfig.size,
      }),
    [backgroundElements, cavnasConfig.size]
  );

  return (
    <Layer onClick={onClick} listening={false}>
      {konvaElements}
    </Layer>
  );
};

export const BackgroundLayer = memo(BackgroundLayerComponent);
