import { Text } from "react-konva";

import type {
  TextElementConfig,
  SmartTextElementConfig,
} from "@/types/top8/Design";
import type { ElementCreator } from "@/types/top8/ElementFactory";
import { SmartText } from "@/components/top8/SmartText/SmartText";
import { resolveColor } from "@/utils/top8/resolveColor";
import { resolveElementText } from "@/utils/top8/resolveElementText";
import { composeFontStyle } from "@/utils/fonts/fontLoader";
import { getElementKey } from "../elementKey";

export const createTextElement: ElementCreator<TextElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { fontFamily = "Arial", design } = context;
  const text = resolveElementText(element, context);

  const fontStyle = composeFontStyle(
    fontFamily,
    element.fontWeight,
    element.fontStyle,
  );

  return (
    <Text
      key={getElementKey(element, index)}
      x={element.position.x}
      y={element.position.y}
      fill={resolveColor(element.fill, design?.colorPalette) ?? "white"}
      fontSize={element.fontSize ?? 20}
      fontStyle={fontStyle}
      fontFamily={fontFamily}
      text={text}
      align={element.align ?? "left"}
      verticalAlign={element.verticalAlign ?? "top"}
      width={element.size?.width}
      height={element.size?.height}
      wrap="word"
      shadowColor={resolveColor(element.shadowColor, design?.colorPalette)}
      shadowBlur={element.shadowBlur}
      shadowOffset={element.shadowOffset}
      shadowOpacity={element.shadowOpacity}
      stroke={resolveColor(
        element.stroke as string | undefined,
        design?.colorPalette,
      )}
      strokeWidth={element.strokeWidth}
      perfectDrawEnabled={context.perfectDraw}
    />
  );
};

export const createSmartTextElement: ElementCreator<SmartTextElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { fontFamily = "Arial", design } = context;
  const text = resolveElementText(element, context);

  const fontStyle = composeFontStyle(
    fontFamily,
    element.fontWeight,
    element.fontStyle,
  );

  return (
    <SmartText
      key={getElementKey(element, index)}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
      fill={resolveColor(element.fill, design?.colorPalette) ?? "white"}
      fontSize={element.fontSize ?? 20}
      fontStyle={fontStyle}
      fontFamily={fontFamily}
      text={text}
      align={element.align ?? "left"}
      verticalAlign={element.verticalAlign}
      anchor={element.anchor}
      shadowColor={resolveColor(element.shadowColor, design?.colorPalette)}
      shadowBlur={element.shadowBlur}
      shadowOffset={element.shadowOffset}
      shadowOpacity={element.shadowOpacity}
      stroke={resolveColor(
        element.stroke as string | undefined,
        design?.colorPalette,
      )}
      strokeWidth={element.strokeWidth}
      perfectDrawEnabled={context.perfectDraw}
    />
  );
};
