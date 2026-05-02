import {
  DEFAULT_PREDICTION_PALETTE,
  type PredictionPalette,
} from "@/types/predict/PredictionPalette";

type Hsl = { h: number; s: number; l: number };
type Rgb = { r: number; g: number; b: number };

const SAMPLE_SIZE = 32;
const HUE_BINS = 12;
const SAT_BINS = 2;
const MIN_SATURATION = 0.15;
const MIN_LIGHTNESS = 0.1;
const MAX_LIGHTNESS = 0.9;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const rgbToHsl = ({ r, g, b }: Rgb): Hsl => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
    else if (max === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
  }
  return { h, s, l };
};

const hslToRgb = ({ h, s, l }: Hsl): Rgb => {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;
  const hueToRgb = (t: number) => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };
  return {
    r: Math.round(hueToRgb(hk + 1 / 3) * 255),
    g: Math.round(hueToRgb(hk) * 255),
    b: Math.round(hueToRgb(hk - 1 / 3) * 255),
  };
};

const rgbToHex = ({ r, g, b }: Rgb): string => {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
};

const hslHex = (h: number, s: number, l: number) =>
  rgbToHex(hslToRgb({ h, s, l }));

const channelLuminance = (c: number) => {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
};

const relativeLuminance = ({ r, g, b }: Rgb) =>
  0.2126 * channelLuminance(r) +
  0.7152 * channelLuminance(g) +
  0.0722 * channelLuminance(b);

const wcagContrast = (a: Rgb, b: Rgb) => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

const hexToRgb = (hex: string): Rgb => {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
};

const loadImageWithTimeout = (
  url: string,
  timeoutMs: number,
): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let done = false;
    const finish = (result: HTMLImageElement | null) => {
      if (done) return;
      done = true;
      resolve(result);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      finish(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      finish(null);
    };
    img.src = url;
  });

export const extractDominantHsl = async (
  imageUrl: string,
  timeoutMs = 1500,
): Promise<Hsl | null> => {
  if (typeof window === "undefined") return null;

  const img = await loadImageWithTimeout(imageUrl, timeoutMs);
  if (!img) return null;

  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  try {
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  } catch {
    return null;
  }

  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
  } catch {
    // CORS-tainted canvas
    return null;
  }

  type Bin = { h: number; s: number; l: number; weight: number; count: number };
  const bins: Bin[] = Array.from({ length: HUE_BINS * SAT_BINS }, () => ({
    h: 0,
    s: 0,
    l: 0,
    weight: 0,
    count: 0,
  }));

  let fallbackH = 0;
  let fallbackS = 0;
  let fallbackL = 0;
  let fallbackCount = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (a < 200) continue;

    const rgb = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
    const hsl = rgbToHsl(rgb);

    fallbackH += hsl.h;
    fallbackS += hsl.s;
    fallbackL += hsl.l;
    fallbackCount += 1;

    if (
      hsl.s < MIN_SATURATION ||
      hsl.l < MIN_LIGHTNESS ||
      hsl.l > MAX_LIGHTNESS
    ) {
      continue;
    }

    const hueBin = Math.min(
      HUE_BINS - 1,
      Math.floor((hsl.h / 360) * HUE_BINS),
    );
    const satBin = hsl.s < 0.5 ? 0 : 1;
    const idx = hueBin * SAT_BINS + satBin;
    const weight = hsl.s * Math.min(hsl.l, 1 - hsl.l);

    const bin = bins[idx];
    bin.h += hsl.h * weight;
    bin.s += hsl.s * weight;
    bin.l += hsl.l * weight;
    bin.weight += weight;
    bin.count += 1;
  }

  let best: Bin | null = null;
  for (const bin of bins) {
    if (bin.weight === 0) continue;
    if (!best || bin.weight > best.weight) best = bin;
  }

  if (best) {
    return {
      h: best.h / best.weight,
      s: best.s / best.weight,
      l: best.l / best.weight,
    };
  }

  if (fallbackCount > 0) {
    return {
      h: fallbackH / fallbackCount,
      s: fallbackS / fallbackCount,
      l: fallbackL / fallbackCount,
    };
  }

  return null;
};

export const buildPredictionPalette = (hsl: Hsl | null): PredictionPalette => {
  if (!hsl) return DEFAULT_PREDICTION_PALETTE;

  const h = hsl.h;
  const s = clamp(hsl.s, 0.45, 0.85);

  const bgGradientStart = hslHex(h, s, 0.16);
  const bgGradientEnd = hslHex(h, s, 0.1);
  const bgStartRgb = hexToRgb(bgGradientStart);

  let accentL = 0.62;
  let accentRgb = hslToRgb({ h, s: clamp(s, 0.55, 0.8), l: accentL });
  while (accentL < 0.85 && wcagContrast(accentRgb, bgStartRgb) < 3.0) {
    accentL += 0.05;
    accentRgb = hslToRgb({ h, s: clamp(s, 0.55, 0.8), l: accentL });
  }
  const accent = rgbToHex(accentRgb);
  const accentRowBg = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.28)`;

  const bgIsDark = relativeLuminance(bgStartRgb) < 0.5;

  if (bgIsDark) {
    return {
      bgGradientStart,
      bgGradientEnd,
      accent,
      accentRowBg,
      textPrimary: "#ffffff",
      textSecondary: "#e8e8f0",
      textMuted: "#a8a8c0",
      textFooter: "#5a5a72",
      borderSubtle: "rgba(255, 255, 255, 0.06)",
    };
  }

  return {
    bgGradientStart,
    bgGradientEnd,
    accent,
    accentRowBg,
    textPrimary: "#0a0a1a",
    textSecondary: "#1a1a2e",
    textMuted: "#3a3a52",
    textFooter: "#7a7a92",
    borderSubtle: "rgba(0, 0, 0, 0.08)",
  };
};

export const extractTournamentPalette = async (
  iconUrl: string,
): Promise<PredictionPalette> => {
  try {
    const hsl = await extractDominantHsl(iconUrl);
    return buildPredictionPalette(hsl);
  } catch {
    return DEFAULT_PREDICTION_PALETTE;
  }
};
