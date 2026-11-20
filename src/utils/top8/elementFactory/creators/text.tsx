import { Text } from "react-konva";

import type {
  TextElementConfig,
  SmartTextElementConfig,
} from "@/types/top8/Design";
import type {
  ElementCreator,
  ElementFactoryContext,
} from "@/types/top8/ElementFactory";
import { SmartText } from "@/components/top8/SmartText/SmartText";
import { resolveColor } from "@/utils/top8/resolveColor";
import { resolveElementText } from "@/utils/top8/resolveElementText";
import { composeFontStyle } from "@/utils/fonts/fontLoader";
import { getElementKey } from "../elementKey";
import { getWrappedTextFontSize } from "../layout/measureElement";

/** Everything `text` and `smartText` resolve the same way. */
const resolveTextProps = (
  element: TextElementConfig | SmartTextElementConfig,
  context: ElementFactoryContext,
) => {
  const { fontFamily = "Arial", design } = context;
  const palette = design?.colorPalette;

  return {
    x: element.position.x,
    y: element.position.y,
    width: element.size?.width,
    height: element.size?.height,
    text: resolveElementText(element, context),
    fontFamily,
    fontSize: element.fontSize ?? 20,
    // Always through `composeFontStyle`: Konva's `fontStyle` carries both
    // weight and italic.
    fontStyle: composeFontStyle(
      fontFamily,
      element.fontWeight,
      element.fontStyle,
    ),
    fill: resolveColor(element.fill, palette) ?? "white",
    align: element.align ?? "left",
    shadowColor: resolveColor(element.shadowColor, palette),
    shadowBlur: element.shadowBlur,
    shadowOffset: element.shadowOffset,
    shadowOpacity: element.shadowOpacity,
    stroke: resolveColor(element.stroke as string | undefined, palette),
    strokeWidth: element.strokeWidth,
    // Outlined lettering: the stroke goes under the fill so it thickens the
    // letters outwards instead of eating into them.
    fillAfterStrokeEnabled: element.fillAfterStrokeEnabled,
    lineJoin: element.lineJoin,
    letterSpacing: element.letterSpacing,
    perfectDrawEnabled: context.perfectDraw,
  };
};

/** Text wrapping inside its box, at its configured size unless a
 *  `maxHeight` makes it shrink. */
export const createTextElement: ElementCreator<TextElementConfig> = ({
  element,
  index,
  context,
}) => (
  <Text
    key={getElementKey(element, index)}
    {...resolveTextProps(element, context)}
    fontSize={getWrappedTextFontSize(element, context)}
    verticalAlign={element.verticalAlign ?? "top"}
    wrap="word"
  />
);

/** Text that shrinks to fit its box width and positions itself by anchor. */
export const createSmartTextElement: ElementCreator<SmartTextElementConfig> = ({
  element,
  index,
  context,
}) => (
  <SmartText
    key={getElementKey(element, index)}
    {...resolveTextProps(element, context)}
    verticalAlign={element.verticalAlign}
    anchor={element.anchor}
  />
);
