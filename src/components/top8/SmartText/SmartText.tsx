import { useEffect, useRef, useState } from "react";
import { Text } from "react-konva";
import Konva from "konva";
import { type TextConfig } from "konva/lib/shapes/Text";

const MIN_FONT_SIZE = 8;
const MAX_MEASURE_ITERATIONS = 10;
const SAFETY_MARGIN_RATIO = 0.95;

type SmartTextProps = TextConfig;

function applyNodeTypography(node: Konva.Text, props: SmartTextProps) {
  if (props.fontFamily) node.fontFamily(props.fontFamily);
  if (props.fontStyle) node.fontStyle(props.fontStyle);
  if (props.padding !== undefined) node.padding(props.padding);
  if (props.lineHeight !== undefined) node.lineHeight(props.lineHeight);
  if (props.letterSpacing !== undefined)
    node.letterSpacing(props.letterSpacing);
}

function computeFittedFontSize(
  node: Konva.Text,
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
    shadowOffset: initialShadowOffset = { x: 0, y: 0 },
    ...restProps
  } = props;

  const [adjustedFontSize, setAdjustedFontSize] = useState(fontSize);
  const [offsetY, setOffsetY] = useState(0);
  const [shadowOffset, setShadowOffset] = useState(initialShadowOffset);
  const textRef = useRef<Konva.Text>(null);

  const isCalculatingRef = useRef(false);

  useEffect(() => {
    if (!width || !text) {
      setAdjustedFontSize(fontSize);
      return;
    }

    if (isCalculatingRef.current) return;

    const calculateFontSize = () => {
      const node = textRef.current;
      if (!node) return fontSize;

      isCalculatingRef.current = true;
      const fitted = computeFittedFontSize(node, text, width, fontSize, props);
      isCalculatingRef.current = false;

      return fitted;
    };

    const calculateShadowOffset = () => {
      const node = textRef.current;
      if (!node) return initialShadowOffset;

      const fitted = computeFittedFontSize(node, text, width, fontSize, props);
      return {
        x: (initialShadowOffset.x * fitted) / fontSize,
        y: (initialShadowOffset.y * fitted) / fontSize,
      };
    };

    const calculateOffsetY = () => {
      const node = textRef.current;
      if (!node) return 0;

      if (props.verticalAlign === "bottom") {
        return node.height();
      } else if (props.verticalAlign === "middle") {
        return (node.height() - node.fontSize()) / 2;
      } else {
        return 0;
      }
    };

    const timeoutId = setTimeout(() => {
      setAdjustedFontSize(calculateFontSize());
      setOffsetY(calculateOffsetY());
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
    props.fontFamily,
    props.fontStyle,
    props.padding,
    props.lineHeight,
    props.letterSpacing,
  ]);

  return (
    <Text
      ref={textRef}
      fontSize={adjustedFontSize}
      offsetY={offsetY}
      width={width}
      text={text}
      shadowOffset={shadowOffset}
      {...restProps}
    />
  );
};
