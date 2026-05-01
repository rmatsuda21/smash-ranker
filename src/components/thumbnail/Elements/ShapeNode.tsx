import { memo } from "react";
import { Circle, Rect } from "react-konva";

import { ShapeElement } from "@/types/thumbnail/ThumbnailDesign";

type Props = {
  element: ShapeElement;
  draggable: boolean;
};

const ShapeNodeComponent = ({ element, draggable }: Props) => {
  if (element.shape === "circle") {
    const radius = Math.min(element.width, element.height) / 2;
    return (
      <Circle
        id={element.id}
        name={element.id}
        x={element.x + element.width / 2}
        y={element.y + element.height / 2}
        radius={radius}
        rotation={element.rotation}
        opacity={element.opacity}
        visible={element.visible}
        listening={!element.locked}
        draggable={draggable && !element.locked}
        fill={element.fill}
        stroke={element.stroke}
        strokeWidth={element.strokeWidth}
      />
    );
  }
  return (
    <Rect
      id={element.id}
      name={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.opacity}
      visible={element.visible}
      listening={!element.locked}
      draggable={draggable && !element.locked}
      fill={element.fill}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      cornerRadius={element.cornerRadius ?? 0}
    />
  );
};

export const ShapeNode = memo(ShapeNodeComponent);
