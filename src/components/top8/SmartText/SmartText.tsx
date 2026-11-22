import { useMemo } from "react";
import { Group, Rect, Text } from "react-konva";
import { type TextConfig } from "konva/lib/shapes/Text";

import { fitText, type TextAnchor } from "@/utils/top8/textMetrics";

type SmartTextProps = TextConfig & {
  anchor?: TextAnchor;
  /** `ellipsis` keeps the font size and cuts text that is too wide. */
  overflow?: "shrink" | "ellipsis";
  /** Shrinking stops here; text still too wide gets an ellipsis. */
  minFontSize?: number;
  /** A box behind the text, as wide as the fitted text plus the padding. */
  background?: {
    fill: string;
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
  };
};

/**
 * Text that shrinks to fit its box width and positions itself by an anchor
 * point instead of its top-left corner.
 *
 * The fit is computed during render from the props alone, so the text paints
 * once at its final size. That relies on the font already being loaded, which
 * every canvas guarantees before mounting its stage.
 */
export const SmartText = (props: SmartTextProps) => {
  const {
    fontSize = 16,
    width,
    height,
    text = "",
    shadowOffset: designShadowOffset,
    anchor = "topLeft",
    verticalAlign,
    fontFamily,
    fontStyle,
    padding,
    lineHeight,
    letterSpacing,
    overflow = "shrink",
    minFontSize,
    background,
    x,
    y,
    ...restProps
  } = props;
  const shrink = overflow !== "ellipsis";

  const fitted = useMemo(
    () =>
      fitText({
        text,
        fontSize,
        width,
        height,
        anchor,
        verticalAlign,
        fontFamily,
        fontStyle,
        padding,
        lineHeight,
        letterSpacing,
        shrink,
        minFontSize,
      }),
    [
      text,
      fontSize,
      width,
      height,
      anchor,
      verticalAlign,
      fontFamily,
      fontStyle,
      padding,
      lineHeight,
      letterSpacing,
      shrink,
      minFontSize,
    ],
  );

  // The shadow shrinks with the text so it keeps its proportions.
  const shadowX = designShadowOffset?.x;
  const shadowY = designShadowOffset?.y;
  const shadowOffset = useMemo(() => {
    if (shadowX === undefined || shadowY === undefined) return undefined;
    const scale = fitted.fontSize / fontSize;
    return { x: shadowX * scale, y: shadowY * scale };
  }, [shadowX, shadowY, fitted.fontSize, fontSize]);

  const wraps = shrink && !fitted.truncated;
  const hasBackground = Boolean(background && text);

  const textNode = (
    <Text
      x={hasBackground ? 0 : x}
      y={hasBackground ? 0 : y}
      fontSize={fitted.fontSize}
      offsetX={fitted.offsetX}
      offsetY={fitted.offsetY}
      width={width}
      height={height}
      text={text}
      shadowOffset={shadowOffset}
      fontFamily={fontFamily}
      fontStyle={fontStyle}
      verticalAlign={verticalAlign}
      letterSpacing={letterSpacing}
      wrap={wraps ? "word" : "none"}
      ellipsis={!wraps}
      {...restProps}
    />
  );

  if (!background || !hasBackground) return textNode;

  // Where the line of text sits inside the element's box.
  const lineBox = fitted.fontSize * (lineHeight ?? 1);
  const boxHeight = height ?? lineBox;
  const lineTop =
    verticalAlign === "middle"
      ? (boxHeight - lineBox) / 2
      : verticalAlign === "bottom"
        ? boxHeight - lineBox
        : 0;
  const free = (width ?? fitted.textWidth) - fitted.textWidth;
  const lineLeft =
    restProps.align === "center"
      ? free / 2
      : restProps.align === "right"
        ? free
        : 0;
  const pad = background.padding ?? {};

  return (
    <Group x={x} y={y} listening={restProps.listening}>
      <Rect
        x={lineLeft - fitted.offsetX - (pad.left ?? 0)}
        y={lineTop - fitted.offsetY - (pad.top ?? 0)}
        width={fitted.textWidth + (pad.left ?? 0) + (pad.right ?? 0)}
        height={lineBox + (pad.top ?? 0) + (pad.bottom ?? 0)}
        fill={background.fill}
        perfectDrawEnabled={restProps.perfectDrawEnabled}
        listening={false}
      />
      {textNode}
    </Group>
  );
};
