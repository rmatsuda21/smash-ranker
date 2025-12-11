import { GroupConfig } from "konva/lib/Group";
import { KonvaEventObject } from "konva/lib/Node";
import { useCallback, useState } from "react";
import { Group, Rect } from "react-konva";

type Props = Partial<GroupConfig> & {
  onClick: (e: KonvaEventObject<MouseEvent>) => void;
  isSelected: boolean;
};

export const SelectableElement = ({
  isSelected,
  onClick,
  children,
  ...rest
}: React.PropsWithChildren<Props>) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback((e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;

    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = "pointer";
    }

    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback((e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;

    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = "default";
    }

    setIsHovered(false);
  }, []);

  return (
    <Group
      {...rest}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Rect
        x={0}
        y={0}
        width={rest.width ?? 0}
        height={rest.height ?? 0}
        fill="transparent"
      />
      {children}
      <Rect
        x={0}
        y={0}
        width={rest.width ?? 0}
        height={rest.height ?? 0}
        fill={isHovered ? "rgba(0, 0, 0, 0.2)" : "transparent"}
        stroke={isSelected ? "rgba(0, 0, 255, 0.7)" : "transparent"}
        strokeWidth={15}
        listening={false}
      />
    </Group>
  );
};
