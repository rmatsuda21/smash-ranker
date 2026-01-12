import { Rect } from "react-konva";

import type { RectElementConfig } from "@/types/top8/Design";
import type { ElementCreator } from "@/types/top8/ElementFactory";
import { resolveColor } from "@/utils/top8/resolveColor";

export const createRectElement: ElementCreator<RectElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { design } = context;

  return (
    <Rect
      key={element.id ?? `rect-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
      fill={resolveColor(element.fill, design?.colorPalette) ?? "black"}
      cornerRadius={element.cornerRadius}
      perfectDrawEnabled={context.perfectDraw}
      stroke={resolveColor(
        element.stroke as string | undefined,
        design?.colorPalette
      )}
      strokeWidth={element.strokeWidth}
    />
  );
};

