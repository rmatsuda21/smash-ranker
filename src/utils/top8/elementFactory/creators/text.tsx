import { Text } from "react-konva";

import type {
  TextElementConfig,
  SmartTextElementConfig,
} from "@/types/top8/Design";
import type { ElementCreator } from "@/types/top8/ElementFactory";
import { SmartText } from "@/components/top8/SmartText/SmartText";
import { replacePlaceholders } from "@/utils/top8/replacePlaceholderString";
import { resolveColor } from "@/utils/top8/resolveColor";
import { resolveText } from "@/utils/top8/resolveText";

export const createTextElement: ElementCreator<TextElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { fontFamily = "Arial", design } = context;
  const resolvedText = resolveText(
    element.textId,
    element.text,
    design?.textPalette
  );
  const text = replacePlaceholders(resolvedText, context);

  return (
    <Text
      key={element.id ?? `text-${index}`}
      x={element.position.x}
      y={element.position.y}
      fill={resolveColor(element.fill, design?.colorPalette) ?? "white"}
      fontSize={element.fontSize ?? 20}
      fontStyle={element.fontStyle ?? String(element.fontWeight ?? "normal")}
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
        design?.colorPalette
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
  const resolvedText = resolveText(
    element.textId,
    element.text,
    design?.textPalette
  );
  const text = replacePlaceholders(resolvedText, context);

  return (
    <SmartText
      key={element.id ?? `smartText-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
      fill={resolveColor(element.fill, design?.colorPalette) ?? "white"}
      fontSize={element.fontSize ?? 20}
      fontStyle={element.fontStyle ?? String(element.fontWeight ?? "normal")}
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
        design?.colorPalette
      )}
      strokeWidth={element.strokeWidth}
      perfectDrawEnabled={context.perfectDraw}
    />
  );
};

