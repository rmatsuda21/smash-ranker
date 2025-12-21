import { Font } from "@/store/fontStore";

function parseVariant(variant: string): { weight: string; style: string } {
  if (variant === "regular") {
    return { weight: "400", style: "normal" };
  }

  if (variant === "italic") {
    return { weight: "400", style: "italic" };
  }

  const isItalic = variant.endsWith("italic");
  const style = isItalic ? "italic" : "normal";

  const weight = isItalic ? variant.replace("italic", "") : variant;

  return { weight, style };
}

export async function loadFont({
  fontFamily,
  isVariableFont,
  variants,
  files,
}: Font): Promise<boolean> {
  try {
    if (isVariableFont) {
      const fontUrl = Object.values(files)[0];
      const fontFace = new FontFace(fontFamily, `url(${fontUrl})`, {
        weight: `${variants[0]} ${variants[variants.length - 1]}`,
        style: "normal",
        display: "swap",
      });

      await fontFace.load();
      document.fonts.add(fontFace);

      return true;
    }

    await Promise.all(
      variants.map(async (variant) => {
        const file = files[variant];
        if (!file) return;

        const { weight, style } = parseVariant(variant);
        const fontFace = new FontFace(fontFamily, `url(${file})`, {
          weight,
          style,
          display: "swap",
        });

        await fontFace.load();
        document.fonts.add(fontFace);
      })
    );

    return true;
  } catch (error) {
    console.warn(`Failed to load font "${fontFamily}":`, error);
    throw error;
  }
}
