import { useFontStore } from "@/store/fontStore";
import { logWarning } from "@/utils/observability/log";

import { fontsourceCanvasCssUrl } from "./fontsourceUrls";
import { pickClosestWeight } from "./weightFallback";

// Sample text combining latin + japanese codepoints. Used as a primer for
// document.fonts.load(); face-by-face loads ensure each weight we need is
// fetched up front (Fontsource static japanese packages ship one ~1MB WOFF2
// per weight without unicode-range chunking, so we can't rely on lazy
// fetch).
const SAMPLE_TEXT = "Aa1 \u3042\u6f22";
const SAMPLE_FONT_SPEC = (family: string) => `16px "${family}"`;

const inflight = new Map<string, Promise<void>>();
// Families outside the catalog, where per-weight tracking isn't possible.
const fullyLoaded = new Set<string>();
// Catalog families: which weights have been fetched so far.
const loadedWeights = new Map<string, Set<number>>();
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
      `link[data-canvas-font="${family}"]`,
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
  return fullyLoaded.has(family) || loadedWeights.has(family);
};

export const getWeights = (family: string): number[] => {
  const custom = customFamilies.get(family);
  if (custom) return custom;
  const meta = findFontMeta(family);
  return meta?.weights ?? [400];
};

export const pickWeight = (family: string, requested: number): number =>
  pickClosestWeight(requested, getWeights(family));

// The weight a design is asking for, before snapping to what the family
// ships. Designs carry weight either as `fontWeight` or, in older ones,
// inside the `fontStyle` shorthand.
export const resolveRequestedWeight = (
  fontWeight: number | string | undefined,
  fontStyleRaw: string | undefined,
): number => {
  const styleLower = fontStyleRaw?.toLowerCase() ?? "";

  if (typeof fontWeight === "number") return fontWeight;
  if (typeof fontWeight === "string" && /^\d+$/.test(fontWeight)) {
    return Number.parseInt(fontWeight, 10);
  }
  if (fontStyleRaw && /^\d+$/.test(fontStyleRaw)) {
    return Number.parseInt(fontStyleRaw, 10);
  }
  if (
    styleLower === "bold" ||
    styleLower === "italic bold" ||
    styleLower === "bold italic"
  ) {
    return 700;
  }
  return 400;
};

// Compose a Konva-compatible `fontStyle` string from a design's separate
// fontWeight/fontStyle fields, snapping the requested weight to the closest
// weight the font family actually ships. Konva's `fontStyle` accepts the CSS
// shorthand `[<style>] <weight>` (e.g. `"italic 600"` or `"500"`).
export const composeFontStyle = (
  family: string,
  fontWeight: number | string | undefined,
  fontStyleRaw: string | undefined,
): string => {
  const styleLower = fontStyleRaw?.toLowerCase() ?? "";
  const isItalic =
    styleLower.includes("italic") || styleLower.includes("oblique");

  const picked = pickWeight(
    family,
    resolveRequestedWeight(fontWeight, fontStyleRaw),
  );
  return isItalic ? `italic ${picked}` : `${picked}`;
};

export const registerCustomFamily = (
  family: string,
  weights: number[] = [400],
): void => {
  customFamilies.set(family, weights);
  fullyLoaded.add(family);
};

export const unregisterCustomFamily = (family: string): void => {
  customFamilies.delete(family);
  fullyLoaded.delete(family);
  loadedWeights.delete(family);
};

// Force the browser to fetch the given weights so Konva can measure and
// paint with correct metrics. Driven from known weights via
// document.fonts.load(shorthand, sample) — robust against the FontFace
// registration timing inside the FontFaceSet.
const loadWeights = async (
  family: string,
  weights: number[],
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
        }),
    ),
  );
};

const missingWeights = (family: string, wanted: number[]): number[] => {
  const loaded = loadedWeights.get(family);
  return loaded ? wanted.filter((w) => !loaded.has(w)) : wanted;
};

const markLoaded = (family: string, weights: number[]): void => {
  const loaded = loadedWeights.get(family) ?? new Set<number>();
  weights.forEach((w) => loaded.add(w));
  loadedWeights.set(family, loaded);
};

// A font that fails to load leaves the canvas on fallback metrics. Each
// family is reported once per page load, so a Fontsource or jsDelivr outage
// shows up without one warning per render.
const reportedFontFailures = new Set<string>();

export const reportFontFailure = (
  family: string,
  error: unknown,
  stage: "load" | "custom" | "catalog",
) => {
  const key = `${stage}:${family}`;
  if (reportedFontFailures.has(key)) return;
  reportedFontFailures.add(key);
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  logWarning("font load failed", {
    area: "fonts",
    family,
    stage,
    error: error instanceof Error ? error.message : String(error),
  });
};

/**
 * Loads a font family for canvas use.
 *
 * Pass `requestedWeights` (see `collectDesignFontWeights`) to fetch only the
 * weights a design uses; each is snapped to the closest weight the family
 * ships, matching what `composeFontStyle` picks at render time. Omit it to
 * load every weight, for surfaces where the user can pick any weight.
 * Weights already fetched are never fetched again.
 */
export const loadFamily = (
  family: string,
  requestedWeights?: number[],
): Promise<void> => {
  if (!family) return Promise.resolve();
  if (customFamilies.has(family)) return Promise.resolve();

  const inflightKey = requestedWeights
    ? `${family}|${[...new Set(requestedWeights)].sort((a, b) => a - b).join(",")}`
    : `${family}|*`;

  const existing = inflight.get(inflightKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      await whenCatalogReady();

      if (customFamilies.has(family)) return;

      const meta = findFontMeta(family);
      if (!meta?.id) {
        // Family isn't in the Fontsource catalog (custom font without
        // registration, or unknown family). Best-effort: wait for whatever
        // FontFaces are already declared.
        if (fullyLoaded.has(family)) return;
        await loadWeights(family, []);
        fullyLoaded.add(family);
        return;
      }

      const wanted = requestedWeights
        ? [
            ...new Set(
              requestedWeights.map((w) => pickClosestWeight(w, meta.weights)),
            ),
          ]
        : meta.weights;
      const missing = missingWeights(family, wanted);
      if (missing.length === 0) return;

      await injectCanvasCss(family, fontsourceCanvasCssUrl(meta.id));
      await loadWeights(family, missing);
      markLoaded(family, missing);
    } catch (error) {
      reportFontFailure(family, error, "load");
      throw error;
    }
  })();

  inflight.set(inflightKey, promise);
  promise.finally(() => inflight.delete(inflightKey));
  return promise;
};
