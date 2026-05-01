import { memo, useEffect, useMemo, useRef } from "react";
import { Text as KonvaText } from "react-konva";
import { Text as KonvaTextNode } from "konva/lib/shapes/Text";

import { TextElement } from "@/types/thumbnail/ThumbnailDesign";
import { useThumbnailEditorStore } from "@/store/thumbnailEditorStore";
import { useFontStore } from "@/store/fontStore";
import { computeAutoFitFontSize } from "@/utils/thumbnail/measureText";

type Props = {
  element: TextElement;
  draggable: boolean;
};

const TextNodeComponent = ({ element, draggable }: Props) => {
  const ref = useRef<KonvaTextNode>(null);
  const isEditingThis = useThumbnailEditorStore(
    (s) => s.isEditingTextId === element.id,
  );
  const fonts = useFontStore((s) => s.fonts);

  const effectiveFontSize = useMemo(() => {
    if (!element.autoFit) return element.fontSize;
    return computeAutoFitFontSize(element);
  }, [
    element.autoFit,
    element.text,
    element.fontFamily,
    element.fontStyle,
    element.fontSize,
    element.width,
    element.height,
    element.align,
    element.letterSpacing,
    element.lineHeight,
    fonts,
    element,
  ]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const fontLoadedTrigger = Array.from(fonts).find(
      (f) => f.fontFamily === element.fontFamily,
    )?.loaded;
    if (fontLoadedTrigger) {
      node.getLayer()?.batchDraw();
    }
  }, [fonts, element.fontFamily]);

  return (
    <KonvaText
      ref={ref}
      id={element.id}
      name={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={isEditingThis ? 0 : element.opacity}
      visible={element.visible}
      listening={!element.locked}
      draggable={draggable && !element.locked}
      text={element.text}
      fontFamily={element.fontFamily}
      fontSize={effectiveFontSize}
      fontStyle={element.fontStyle}
      fill={element.fill}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      lineJoin="round"
      lineCap="round"
      align={element.align}
      verticalAlign={
        element.verticalAlign ?? (element.autoFit ? "middle" : "top")
      }
      letterSpacing={element.letterSpacing}
      lineHeight={element.lineHeight}
      shadowEnabled={Boolean(element.shadow)}
      shadowColor={element.shadow?.color}
      shadowBlur={element.shadow?.blur}
      shadowOffsetX={element.shadow?.offsetX}
      shadowOffsetY={element.shadow?.offsetY}
      perfectDrawEnabled={false}
      fillAfterStrokeEnabled={Boolean(element.stroke)}
    />
  );
};

export const TextNode = memo(TextNodeComponent);
