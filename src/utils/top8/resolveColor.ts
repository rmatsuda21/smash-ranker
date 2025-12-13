import { CanvasConfig } from "@/types/top8/LayoutTypes";

export const resolveColor = (
  color: string | undefined,
  palette?: CanvasConfig["colorPalette"]
): string | undefined => {
  if (!color) return color;
  if (!palette) return color;

  if (color in palette) {
    return palette[color].color;
  }

  return color;
};

export const resolvePaletteColors = (
  svgPalette: Record<string, string>,
  colorPalette?: CanvasConfig["colorPalette"]
): Record<string, string> => {
  if (!colorPalette) return svgPalette;

  return Object.fromEntries(
    Object.entries(svgPalette).map(([key, value]) => [
      key,
      resolveColor(value, colorPalette) ?? value,
    ])
  );
};
