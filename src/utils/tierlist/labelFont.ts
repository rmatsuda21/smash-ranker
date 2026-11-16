export const DEFAULT_LABEL_FONT_FAMILY = "M PLUS Rounded 1c";

// Lists saved before the font picker hold a CSS font stack of system fonts
// ("Impact, sans-serif") or "inherit" instead of a single family name.
export const isLegacyFontStack = (family: string): boolean =>
  family === "inherit" || family.includes(",");

/** The stored label font as a CSS `font-family` value. */
export const labelFontFamilyCss = (family: string): string =>
  isLegacyFontStack(family) ? family : `"${family}", sans-serif`;

/** The stored label font as a name to show in the UI. */
export const labelFontDisplayName = (family: string): string =>
  isLegacyFontStack(family)
    ? family.split(",")[0].replace(/['"]/g, "").trim()
    : family;
