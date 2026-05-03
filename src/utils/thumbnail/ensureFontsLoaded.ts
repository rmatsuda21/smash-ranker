import { loadFamily } from "@/utils/fonts/fontLoader";
import { ThumbnailDesign } from "@/types/thumbnail/ThumbnailDesign";
import { flattenTree } from "./elementTree";

// Walk a design's tree and load every font family referenced by a text
// element. Does NOT mutate the global selectedFont — fonts are tied to the
// individual elements that use them, not to a global "active font".
export const ensureFontsLoaded = async (
  design: ThumbnailDesign
): Promise<void> => {
  const families = new Set<string>();
  for (const el of flattenTree(design.elements)) {
    if (el.type === "text" && el.fontFamily) {
      families.add(el.fontFamily);
    }
  }
  if (families.size === 0) return;

  await Promise.all(
    Array.from(families).map((family) =>
      loadFamily(family).catch((e) => {
        console.warn(`Failed to load font "${family}"`, e);
      })
    )
  );
};
