import { type Design } from "@/types/top8/Design";

export const resolveText = (
  textId?: string,
  text?: string,
  textPalette?: Design["textPalette"]
): string => {
  if (textId && textPalette && textId in textPalette) {
    return textPalette[textId].text;
  }

  return text ?? "";
};
