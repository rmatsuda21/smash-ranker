import { useEffect, useRef, useState } from "react";
import { Text } from "react-konva";
import { Text as KonvaText, type TextConfig } from "konva/lib/shapes/Text";

const MIN_FONT_SIZE = 8;
const MAX_MEASURE_ITERATIONS = 10;
const SAFETY_MARGIN_RATIO = 0.95;

type Anchor =
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "bottomMiddle"
  | "topMiddle"
  | "leftMiddle"
  | "rightMiddle"
  | "center";

type SmartTextProps = TextConfig & {
  anchor?: Anchor;
};

function calculateAnchorOffsets(
  node: KonvaText,
  anchor: Anchor
): { offsetX: number; offsetY: number } {
  const textWidth = node.width();
  const textHeight = node.height();

  switch (anchor) {
    case "topRight":
      return { offsetX: textWidth, offsetY: 0 };
    case "bottomLeft":
      return { offsetX: 0, offsetY: textHeight };
    case "bottomRight":
      return { offsetX: textWidth, offsetY: textHeight };
    case "bottomMiddle":
      return { offsetX: textWidth / 2, offsetY: textHeight };
    case "topMiddle":
      return { offsetX: textWidth / 2, offsetY: 0 };
    case "leftMiddle":
      return { offsetX: 0, offsetY: textHeight / 2 };
    case "rightMiddle":
      return { offsetX: textWidth, offsetY: textHeight / 2 };
    case "center":
      return { offsetX: textWidth / 2, offsetY: textHeight / 2 };
    case "topLeft":
    default:
      return { offsetX: 0, offsetY: 0 };
  }
}

function applyNodeTypography(node: KonvaText, props: SmartTextProps) {
  if (props.fontFamily) node.fontFamily(props.fontFamily);
  if (props.fontStyle) node.fontStyle(props.fontStyle);
  if (props.padding !== undefined) node.padding(props.padding);
  if (props.lineHeight !== undefined) node.lineHeight(props.lineHeight);
  if (props.letterSpacing !== undefined)
    node.letterSpacing(props.letterSpacing);
}

function computeFittedFontSize(
  node: KonvaText,
  content: string,
  targetWidth: number,
  baseFontSize: number,
  props: SmartTextProps
) {
  node.text(content);
  node.fontSize(baseFontSize);
  applyNodeTypography(node, props);

  let currentSize = baseFontSize;
  let iterations = 0;
  let measuredWidth = node.measureSize(content).width;

  while (measuredWidth > targetWidth && iterations < MAX_MEASURE_ITERATIONS) {
    const ratio = targetWidth / measuredWidth;
    const nextSize = Math.max(
      Math.floor(currentSize * ratio * SAFETY_MARGIN_RATIO),
      MIN_FONT_SIZE
    );

    if (nextSize === currentSize) break;

    currentSize = nextSize;
    node.fontSize(currentSize);
    measuredWidth = node.measureSize(content).width;
    iterations++;
  }

  return currentSize;
}

export const SmartText = (props: SmartTextProps) => {
  const {
    fontSize = 16,
    width,
    text = "",
    shadowOffset: initialShadowOffset,
    anchor = "topLeft",
    fontFamily,
    fontStyle,
    padding,
    lineHeight,
    letterSpacing,
    ...restProps
  } = props;

  const [adjustedFontSize, setAdjustedFontSize] = useState(fontSize);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [shadowOffset, setShadowOffset] = useState(initialShadowOffset);
  const textRef = useRef<KonvaText>(null);

  const isCalculatingRef = useRef(false);

  useEffect(() => {
    if (!text) {
      setAdjustedFontSize(fontSize);
      return;
    }

    if (isCalculatingRef.current || !textRef.current) return;

    const typographyProps = {
      fontFamily,
      fontStyle,
      padding,
      lineHeight,
      letterSpacing,
    };

    const calculateFontSize = () => {
      const node = textRef.current;
      if (!node || !width) return fontSize;

      isCalculatingRef.current = true;
      const fitted = computeFittedFontSize(
        node,
        text,
        width,
        fontSize,
        typographyProps
      );
      isCalculatingRef.current = false;

      return fitted;
    };

    const calculateShadowOffset = () => {
      const node = textRef.current;
      if (!node || !initialShadowOffset) return initialShadowOffset;

      const _width = width ?? node.measureSize(text).width;
      const fitted = computeFittedFontSize(
        node,
        text,
        _width,
        fontSize,
        typographyProps
      );
      return {
        x: (initialShadowOffset.x * fitted) / fontSize,
        y: (initialShadowOffset.y * fitted) / fontSize,
      };
    };

    const calculateAnchorOffset = () => {
      const node = textRef.current;
      if (!node) return { offsetX: 0, offsetY: 0 };

      return calculateAnchorOffsets(node, anchor);
    };

    const timeoutId = setTimeout(() => {
      setAdjustedFontSize(calculateFontSize());
      const anchorOffset = calculateAnchorOffset();
      setOffsetX(anchorOffset.offsetX);
      setOffsetY(anchorOffset.offsetY);
      setShadowOffset(calculateShadowOffset());
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      isCalculatingRef.current = false;
    };
  }, [
    fontSize,
    width,
    text,
    initialShadowOffset,
    anchor,
    fontFamily,
    fontStyle,
    padding,
    lineHeight,
    letterSpacing,
  ]);

  return (
    <Text
      ref={textRef}
      fontSize={adjustedFontSize}
      offsetX={offsetX}
      offsetY={offsetY}
      width={width}
      text={text}
      shadowOffset={shadowOffset}
      fontFamily={fontFamily}
      fontStyle={fontStyle}
      {...restProps}
    />
  );
};
