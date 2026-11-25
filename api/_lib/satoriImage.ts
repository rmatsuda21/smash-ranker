import sharp from "sharp";

// satori cannot read WebP (Hivee's icons are), so those become PNG first.
export async function toSatoriImage(
  dataUrl: string | null,
): Promise<string | null> {
  const prefix = "data:image/webp;base64,";
  if (!dataUrl?.startsWith(prefix)) return dataUrl;
  try {
    const png = await sharp(Buffer.from(dataUrl.slice(prefix.length), "base64"))
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}
