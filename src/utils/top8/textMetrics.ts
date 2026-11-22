/**
 * Text measurement for the Top 8 pipeline, outside the render tree.
 *
 * Everything measures through a detached Konva `Text` node so the numbers are
 * exactly what Konva will lay out, and results are cached because the same
 * strings are measured again on every layout pass.
 */
import { Text as KonvaText, type TextConfig } from "konva/lib/shapes/Text";

const MIN_FONT_SIZE = 8;
const MAX_FIT_ITERATIONS = 10;
const FIT_SAFETY_MARGIN = 0.95;

const MAX_CACHE_ENTRIES = 2000;

/** A cache that empties itself rather than tracking recency: entries are tiny
 *  and cheap to recompute, so the bound only has to stop unbounded growth. */
const createCache = <T>() => {
  const entries = new Map<string, T>();
  caches.push(entries);
  return (key: string, compute: () => T): T => {
    const cached = entries.get(key);
    if (cached !== undefined) return cached;

    if (entries.size >= MAX_CACHE_ENTRIES) entries.clear();
    const value = compute();
    entries.set(key, value);
    return value;
  };
};

const caches: Map<string, unknown>[] = [];

let metricsVersion = 0;
const metricsListeners = new Set<() => void>();

// A measurement taken before a font finished loading used fallback metrics.
if (typeof document !== "undefined" && document.fonts) {
  document.fonts.addEventListener("loadingdone", () => {
    for (const cache of caches) cache.clear();
    metricsVersion++;
    for (const listener of metricsListeners) listener();
  });
}

/** Changes whenever earlier measurements may be stale (a font finished
 *  loading). For layout that is memoized on measured text. */
export const getTextMetricsVersion = () => metricsVersion;

export const subscribeTextMetrics = (listener: () => void) => {
  metricsListeners.add(listener);
  return () => {
    metricsListeners.delete(listener);
  };
};

/** Drops `undefined` values so Konva falls back to its own defaults. */
const defined = <T extends object>(config: T): T =>
  Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== undefined),
  ) as T;

type BoxWidthInput = {
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: string;
  /** Fixed box width, when the element has one. */
  width?: number;
  letterSpacing?: number;
};

const boxWidthCache = createCache<number>();

/** Width of a word-wrapped text box: the fixed width when given, otherwise
 *  the width of the text itself. */
export const measureTextBoxWidth = (input: BoxWidthInput): number =>
  boxWidthCache(JSON.stringify(input), () =>
    new KonvaText(defined({ ...input, wrap: "word" })).width(),
  );

const boxHeightCache = createCache<number>();

/** Height of a word-wrapped text box of a fixed width: one line box per
 *  wrapped line. */
export const measureTextBoxHeight = (
  input: BoxWidthInput & { width: number },
): number =>
  boxHeightCache(JSON.stringify(input), () =>
    new KonvaText(defined({ ...input, wrap: "word" })).height(),
  );

const wrappedFitCache = createCache<number>();

/** Largest font size, up to `fontSize`, at which the text wrapped to `width`
 *  is no taller than `maxHeight`. */
export const fitWrappedFontSize = (
  input: BoxWidthInput & { width: number; maxHeight: number },
): number =>
  wrappedFitCache(JSON.stringify(input), () => {
    const { maxHeight, ...box } = input;
    let fontSize = box.fontSize;
    while (
      fontSize > MIN_FONT_SIZE &&
      measureTextBoxHeight({ ...box, fontSize }) > maxHeight
    ) {
      fontSize -= 1;
    }
    return fontSize;
  });

export type TextAnchor =
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "bottomMiddle"
  | "topMiddle"
  | "leftMiddle"
  | "rightMiddle"
  | "center";

type FitInput = {
  text: string;
  /** The design's font size; the fit only ever shrinks from it. */
  fontSize: number;
  width?: number;
  height?: number;
  anchor: TextAnchor;
  verticalAlign?: string;
  /** `false` keeps the design's size whatever the width (the text is cut
   *  off instead). */
  shrink?: boolean;
  /** Smallest size the fit goes down to. Text too wide even then is
   *  `truncated`. */
  minFontSize?: number;
} & Pick<
  TextConfig,
  "fontFamily" | "fontStyle" | "padding" | "lineHeight" | "letterSpacing"
>;

export type FittedText = {
  /** Largest size, at most the design's, at which the text fits `width`. */
  fontSize: number;
  /** Node offset that puts the anchor point at the node's position. */
  offsetX: number;
  offsetY: number;
  /** Width of the text at the fitted size, no wider than the box. */
  textWidth: number;
  /** Still too wide at `minFontSize`: draw it on one line with an ellipsis. */
  truncated: boolean;
};

const anchorOffsets = (
  anchor: TextAnchor,
  width: number,
  height: number,
): { offsetX: number; offsetY: number } => {
  switch (anchor) {
    case "topRight":
      return { offsetX: width, offsetY: 0 };
    case "bottomLeft":
      return { offsetX: 0, offsetY: height };
    case "bottomRight":
      return { offsetX: width, offsetY: height };
    case "bottomMiddle":
      return { offsetX: width / 2, offsetY: height };
    case "topMiddle":
      return { offsetX: width / 2, offsetY: 0 };
    case "leftMiddle":
      return { offsetX: 0, offsetY: height / 2 };
    case "rightMiddle":
      return { offsetX: width, offsetY: height / 2 };
    case "center":
      return { offsetX: width / 2, offsetY: height / 2 };
    case "topLeft":
    default:
      return { offsetX: 0, offsetY: 0 };
  }
};

let glyphContext: CanvasRenderingContext2D | null | undefined;

/**
 * How far below the vertical center of its box Konva draws the capitals of
 * middle-aligned text; subtracting it from the node's offset centers them.
 *
 * Konva puts the alphabetic baseline at the box center plus half of
 * (font ascent - font descent), which centers the font's whole line box.
 * That box reserves more room above the capitals than below them (accents,
 * CJK), so the capitals end up low: about 0.07em in Noto Sans JP.
 *
 * It is measured from a fixed capital, not from the text being drawn, so it
 * depends only on the font: every string in the same font and size ends up
 * on the same baseline. Centering each string's own ink would move "Ego"
 * (descender) and "KKV | MC" (tall bar) off the baseline of the "Prez"
 * beside them.
 */
const middleAlignCorrection = (node: KonvaText): number => {
  glyphContext ??= document.createElement("canvas").getContext("2d");
  if (!glyphContext) return 0;

  glyphContext.font = `${node.fontStyle()} ${node.fontSize()}px ${node.fontFamily()}`;
  glyphContext.textBaseline = "alphabetic";
  const cap = glyphContext.measureText("H");
  // Same glyph and fallbacks Konva reads its line box from.
  const line = glyphContext.measureText("M");

  if (
    cap.actualBoundingBoxAscent === undefined ||
    cap.actualBoundingBoxDescent === undefined
  ) {
    return 0;
  }

  const lineAscent = line.fontBoundingBoxAscent ?? line.actualBoundingBoxAscent;
  const lineDescent =
    line.fontBoundingBoxDescent ?? line.actualBoundingBoxDescent;

  // Both are heights above the baseline: where the capitals' center is, and
  // where Konva puts the center of the box.
  const capCenter =
    (cap.actualBoundingBoxAscent - cap.actualBoundingBoxDescent) / 2;
  const boxCenter = (lineAscent - lineDescent) / 2;

  return capCenter - boxCenter;
};

const fitCache = createCache<FittedText>();

const computeFit = ({
  text,
  fontSize,
  width,
  height,
  anchor,
  verticalAlign,
  shrink = true,
  minFontSize,
  ...typography
}: FitInput): FittedText => {
  if (!text) {
    return { fontSize, offsetX: 0, offsetY: 0, textWidth: 0, truncated: false };
  }
  const smallest = Math.min(minFontSize ?? MIN_FONT_SIZE, fontSize);

  // Single-line node for the fit loop: no box, so nothing wraps.
  const node = new KonvaText(defined({ ...typography, text, fontSize }));

  // `measureSize` leaves letter spacing out; Konva adds it after every
  // character when it lays the line out.
  const spacing = (typography.letterSpacing ?? 0) * text.length;
  const measure = () => node.measureSize(text).width + spacing;

  let fitted = fontSize;
  if (width && shrink) {
    let measuredWidth = measure();

    for (let i = 0; measuredWidth > width && i < MAX_FIT_ITERATIONS; i++) {
      const nextSize = Math.max(
        Math.floor(fitted * (width / measuredWidth) * FIT_SAFETY_MARGIN),
        smallest,
      );
      if (nextSize === fitted) break;

      fitted = nextSize;
      node.fontSize(fitted);
      measuredWidth = measure();
    }

    // The loop above undershoots (safety margin, rounding down), which
    // leaves the text visibly smaller than its box. Step back up to the
    // largest whole size that still fits.
    while (fitted < fontSize) {
      node.fontSize(fitted + 1);
      if (measure() > width) break;
      fitted += 1;
    }
    node.fontSize(fitted);
  }

  const measuredWidth = measure();
  const truncated =
    shrink && minFontSize !== undefined && !!width && measuredWidth > width;
  const textWidth = width ? Math.min(measuredWidth, width) : measuredWidth;

  // Now give it the real box to read the laid-out size (text that still
  // overflows at the minimum size wraps and gets taller, unless it is cut).
  node.setAttrs(
    defined({ width, height, wrap: shrink && !truncated ? "word" : "none" }),
  );
  const { offsetX, offsetY } = anchorOffsets(
    anchor,
    node.width(),
    node.height(),
  );
  const correction =
    verticalAlign === "middle" ? middleAlignCorrection(node) : 0;

  return {
    fontSize: fitted,
    offsetX,
    offsetY: offsetY - correction,
    textWidth,
    truncated,
  };
};

/** Shrinks text to fit its box width and resolves its anchor offsets. */
export const fitText = (input: FitInput): FittedText =>
  fitCache(JSON.stringify(input), () => computeFit(input));
