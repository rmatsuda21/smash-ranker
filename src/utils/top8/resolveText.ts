import { CanvasConfig } from "@/types/top8/Design";

export const resolveText = (
  textId: string | undefined,
  text: string | undefined,
  textPalette?: CanvasConfig["textPalette"]
): string => {
  if (textId && textPalette && textId in textPalette) {
    return textPalette[textId].text;
  }

  return text ?? "";
};
