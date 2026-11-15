import type {
  SmartTextElementConfig,
  TextElementConfig,
} from "@/types/top8/Design";
import type { ElementFactoryContext } from "@/types/top8/ElementFactory";
import { replacePlaceholders } from "@/utils/top8/replacePlaceholderString";
import { resolveText } from "@/utils/top8/resolveText";

/**
 * The exact string a text element draws: text palette lookup, placeholder
 * substitution, then `textTransform`. Rendering and flex measurement must both
 * go through this, or measured widths drift from what is painted.
 */
export const resolveElementText = (
  element: TextElementConfig | SmartTextElementConfig,
  context: ElementFactoryContext,
): string => {
  const text = replacePlaceholders(
    resolveText(element.textId, element.text, context.design?.textPalette),
    context,
  );

  if (element.textTransform === "uppercase") return text.toUpperCase();
  if (element.textTransform === "lowercase") return text.toLowerCase();
  return text;
};
