export type ColorPalette = Record<string, string>;

export const resolveColor = (
  color: string | undefined,
  palette?: ColorPalette
): string | undefined => {
  if (!color) return color;
  if (!palette) return color;

  if (color in palette) {
    return palette[color];
  }

  return color;
};

export const resolvePaletteColors = (
  svgPalette: Record<string, string>,
  colorPalette?: ColorPalette
): Record<string, string> => {
  if (!colorPalette) return svgPalette;

  return Object.fromEntries(
    Object.entries(svgPalette).map(([key, value]) => [
      key,
      resolveColor(value, colorPalette) ?? value,
    ])
  );
};
