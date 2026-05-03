import { useFontStore } from "@/store/fontStore";

import { fontsourceCanvasCssUrl } from "./fontsourceUrls";
import { pickClosestWeight } from "./weightFallback";

// Sample text combining latin + japanese codepoints. Used as a primer for
// document.fonts.load(); subsequent face-by-face loads ensure every weight
// declared in the family's CSS is fetched (Fontsource static japanese
// packages ship one ~1MB WOFF2 per weight without unicode-range chunking,
// so we can't rely on lazy fetch).
const SAMPLE_TEXT = "Aa1 \u3042\u6f22";
const SAMPLE_FONT_SPEC = (family: string) => `16px "${family}"`;

const inflight = new Map<string, Promise<void>>();
const fullyLoaded = new Set<string>();
const customFamilies = new Map<string, number[]>();

const whenCatalogReady = (): Promise<void> => {
  const store = useFontStore.getState();
  if (!store.fetching) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = useFontStore.subscribe((state) => {
      if (!state.fetching) {
        unsub();
        resolve();
      }
    });
  });
};

const injectCanvasCss = (family: string, cssUrl: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `link[data-canvas-font="${family}"]`
    );
    if (existing) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssUrl;
    link.setAttribute("data-canvas-font", family);
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load ${cssUrl}`));
    document.head.appendChild(link);
  });

const findFontMeta = (family: string) => {
  const fonts = useFontStore.getState().fonts;
  return Array.from(fonts).find((f) => f.fontFamily === family);
};

export const isLoaded = (family: string): boolean => {
  if (!family) return false;
  if (customFamilies.has(family)) return true;
  return fullyLoaded.has(family);
};

export const getWeights = (family: string): number[] => {
  const custom = customFamilies.get(family);
  if (custom) return custom;
  const meta = findFontMeta(family);
  return meta?.weights ?? [400];
};

export const pickWeight = (family: string, requested: number): number =>
  pickClosestWeight(requested, getWeights(family));

// Compose a Konva-compatible `fontStyle` string from a design's separate
// fontWeight/fontStyle fields, snapping the requested weight to the closest
// weight the font family actually ships. Konva's `fontStyle` accepts the CSS
// shorthand `[<style>] <weight>` (e.g. `"italic 600"` or `"500"`).
export const composeFontStyle = (
  family: string,
  fontWeight: number | string | undefined,
  fontStyleRaw: string | undefined
): string => {
  const styleLower = fontStyleRaw?.toLowerCase() ?? "";
  const isItalic = styleLower.includes("italic") || styleLower.includes("oblique");

  let requested: number;
  if (typeof fontWeight === "number") {
    requested = fontWeight;
  } else if (typeof fontWeight === "string" && /^\d+$/.test(fontWeight)) {
    requested = Number.parseInt(fontWeight, 10);
  } else if (fontStyleRaw && /^\d+$/.test(fontStyleRaw)) {
    requested = Number.parseInt(fontStyleRaw, 10);
  } else if (
    styleLower === "bold" ||
    styleLower === "italic bold" ||
    styleLower === "bold italic"
  ) {
    requested = 700;
  } else {
    requested = 400;
  }

  const picked = pickWeight(family, requested);
  return isItalic ? `italic ${picked}` : `${picked}`;
};

export const registerCustomFamily = (
  family: string,
  weights: number[] = [400]
): void => {
  customFamilies.set(family, weights);
  fullyLoaded.add(family);
};

export const unregisterCustomFamily = (family: string): void => {
  customFamilies.delete(family);
  fullyLoaded.delete(family);
};

// Force the browser to fetch every weight declared in the family's CSS so
// Konva can measure and paint with correct metrics regardless of which
// weights the design references. We drive this from the catalog's known
// weights via document.fonts.load(shorthand, sample) — robust against the
// FontFace registration timing inside the FontFaceSet.
const loadAllWeights = async (
  family: string,
  weights: number[]
): Promise<void> => {
  if (weights.length === 0) {
    try {
      await document.fonts.load(SAMPLE_FONT_SPEC(family), SAMPLE_TEXT);
    } catch {
      /* ignore */
    }
    return;
  }

  await Promise.all(
    weights.map((weight) =>
      document.fonts
        .load(`${weight} 16px "${family}"`, SAMPLE_TEXT)
        .catch(() => {
          /* individual weight failures shouldn't block the rest */
        })
    )
  );
};

export const loadFamily = (family: string): Promise<void> => {
  if (!family) return Promise.resolve();

  const existing = inflight.get(family);
  if (existing) return existing;

  if (isLoaded(family)) return Promise.resolve();

  const promise = (async () => {
    try {
      if (!customFamilies.has(family)) {
        await whenCatalogReady();
      }

      if (isLoaded(family)) return;

      const meta = findFontMeta(family);
      if (!meta?.id) {
        // Family isn't in the Fontsource catalog (custom font without
        // registration, or unknown family). Best-effort: wait for whatever
        // FontFaces are already declared.
        await loadAllWeights(family, []);
        fullyLoaded.add(family);
        return;
      }

      await injectCanvasCss(family, fontsourceCanvasCssUrl(meta.id));
      await loadAllWeights(family, meta.weights);
      fullyLoaded.add(family);
    } catch (error) {
      console.warn(`Font load failed: "${family}"`, error);
      throw error;
    }
  })();

  inflight.set(family, promise);
  promise.finally(() => inflight.delete(family));
  return promise;
};
