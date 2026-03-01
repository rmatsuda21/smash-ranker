export async function registerCustomFontFace(
  fontFamily: string,
  data: Blob
): Promise<void> {
  const buffer = await data.arrayBuffer();
  const fontFace = new FontFace(fontFamily, buffer, {
    style: "normal",
    display: "swap",
  });
  await fontFace.load();
  document.fonts.add(fontFace);
}

export function getFontFamilyFromFileName(fileName: string): string {
  return fileName
    .replace(/\.(ttf|otf|woff|woff2)$/i, "")
    .replace(/[-_]/g, " ");
}
