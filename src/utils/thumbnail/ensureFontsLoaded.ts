import { loadFont } from "@/utils/top8/loadFont";
import { useFontStore } from "@/store/fontStore";
import { ThumbnailDesign } from "@/types/thumbnail/ThumbnailDesign";
import { flattenTree } from "./elementTree";

// Walk a design's tree and load every font family referenced by a text
// element. Does NOT mutate the global selectedFont — fonts are tied to the
// individual elements that use them, not to a global "active font".
export const ensureFontsLoaded = async (
  design: ThumbnailDesign,
): Promise<void> => {
  const families = new Set<string>();
  for (const el of flattenTree(design.elements)) {
    if (el.type === "text" && el.fontFamily) {
      families.add(el.fontFamily);
    }
  }
  if (families.size === 0) return;

  const allFonts = useFontStore.getState().fonts;
  const fontList = Array.from(allFonts);

  await Promise.all(
    Array.from(families).map(async (family) => {
      const font = fontList.find((f) => f.fontFamily === family);
      if (!font || font.loaded) return;
      try {
        await loadFont(font);
      } catch (e) {
        console.warn(`Failed to load font "${family}"`, e);
      }
    }),
  );
};

export const ensureSingleFontLoaded = async (
  fontFamily: string,
): Promise<void> => {
  if (!fontFamily) return;
  const allFonts = useFontStore.getState().fonts;
  const font = Array.from(allFonts).find((f) => f.fontFamily === fontFamily);
  if (!font || font.loaded) return;
  try {
    await loadFont(font);
  } catch (e) {
    console.warn(`Failed to load font "${fontFamily}"`, e);
  }
};
