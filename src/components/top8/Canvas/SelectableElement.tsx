import { Group as KonvaGroup } from "konva/lib/Group";
import { GroupConfig } from "konva/lib/Group";
import { KonvaEventObject } from "konva/lib/Node";
import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Rect } from "react-konva";

type Props = Partial<GroupConfig> & {
  onClick: (e: KonvaEventObject<MouseEvent>) => void;
};

export const SelectableElement = ({
  onClick,
  children,
  ...rest
}: React.PropsWithChildren<Props>) => {
  const [isHovered, setIsHovered] = useState(false);
  const contentRef = useRef<KonvaGroup>(null);
  const [contentBounds, setContentBounds] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!contentRef.current) return;

    const measureBounds = () => {
      if (!contentRef.current) return null;
      const parent = contentRef.current.getParent();
      return contentRef.current.getClientRect(
        parent ? { relativeTo: parent } : undefined
      );
    };

    const initialBox = measureBounds();
    if (initialBox) {
      setContentBounds({
        x: initialBox.x,
        y: initialBox.y,
        width: initialBox.width,
        height: initialBox.height,
      });
    }

    const timeoutId = setTimeout(() => {
      const box = measureBounds();
      if (box) {
        setContentBounds((prev) => {
          if (
            prev.x !== box.x ||
            prev.y !== box.y ||
            prev.width !== box.width ||
            prev.height !== box.height
          ) {
            return {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
            };
          }
          return prev;
        });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [children]);

  const hasExplicitSize = rest.width !== undefined && rest.height !== undefined;
  const width = rest.width ?? contentBounds.width;
  const height = rest.height ?? contentBounds.height;
  const rectX = hasExplicitSize ? 0 : contentBounds.x;
  const rectY = hasExplicitSize ? 0 : contentBounds.y;

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
        x={rectX}
        y={rectY}
        width={width}
        height={height}
        fill="transparent"
      />
      <Group ref={contentRef}>{children}</Group>
      <Rect
        x={rectX}
        y={rectY}
        width={width}
        height={height}
        fill={isHovered ? "rgba(0, 0, 0, 0.2)" : "transparent"}
        listening={false}
      />
    </Group>
  );
};
