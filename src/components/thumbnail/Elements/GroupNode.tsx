import { memo } from "react";
import { Group } from "react-konva";

import { GroupElement } from "@/types/thumbnail/ThumbnailDesign";

import { ElementNode } from "./ElementNode";

type Props = {
  element: GroupElement;
  draggable: boolean;
};

const GroupNodeComponent = ({ element, draggable }: Props) => {
  return (
    <Group
      id={element.id}
      name={element.id}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      scaleX={element.scaleX ?? 1}
      scaleY={element.scaleY ?? 1}
      opacity={element.opacity}
      visible={element.visible}
      listening={!element.locked}
      draggable={draggable && !element.locked}
    >
      {element.children.map((child) => (
        <ElementNode key={child.id} element={child} draggable={false} />
      ))}
    </Group>
  );
};

export const GroupNode = memo(GroupNodeComponent);
