import { Group as KonvaGroup } from "konva/lib/Group";
import { GroupConfig } from "konva/lib/Group";
import { KonvaEventObject } from "konva/lib/Node";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const contentRef = useRef<KonvaGroup>(null);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  // Measure the actual content size after render
  useEffect(() => {
    if (contentRef.current) {
      const parent = contentRef.current.getParent();
      const box = contentRef.current.getClientRect(
        parent ? { relativeTo: parent } : undefined
      );
      setContentSize({ width: box.width, height: box.height });
    }
  }, [children]);

  // Use explicit size if provided, otherwise use measured content size
  const width = rest.width ?? contentSize.width;
  const height = rest.height ?? contentSize.height;

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
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />
      <Group ref={contentRef}>{children}</Group>
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={isHovered ? "rgba(0, 0, 0, 0.2)" : "transparent"}
        stroke={isSelected ? "rgba(0, 0, 255, 0.7)" : "transparent"}
        strokeWidth={15}
        listening={false}
      />
    </Group>
  );
};
