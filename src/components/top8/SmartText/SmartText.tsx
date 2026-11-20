import { useMemo } from "react";
import { Text } from "react-konva";
import { type TextConfig } from "konva/lib/shapes/Text";

import { fitText, type TextAnchor } from "@/utils/top8/textMetrics";

type SmartTextProps = TextConfig & {
  anchor?: TextAnchor;
  /** `ellipsis` keeps the font size and cuts text that is too wide. */
  overflow?: "shrink" | "ellipsis";
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

  return (
    <Text
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
      wrap={shrink ? "word" : "none"}
      ellipsis={!shrink}
      {...restProps}
    />
  );
};
