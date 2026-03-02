/**
 * Ports the SCSS `generate-scale` mixin to JavaScript for runtime accent color generation.
 * Replicates Sass `color.scale()` and `color.mix()` in HSL/RGB space.
 */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Replicates Sass `color.scale($color, $lightness: X%, $saturation: Y%)`.
 * Scales each channel proportionally toward its max (positive) or min (negative).
 */
function scaleColor(
  hex: string,
  lightness: number,
  saturation: number
): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);

  // Sass color.scale scales toward max (1) if positive, toward min (0) if negative
  const scaledL =
    lightness < 0 ? l + l * lightness : l + (1 - l) * lightness;
  const scaledS =
    saturation < 0 ? s + s * saturation : s + (1 - s) * saturation;

  const [nr, ng, nb] = hslToRgb(h, scaledS, scaledL);
  return rgbToHex(nr, ng, nb);
}

/**
 * Replicates Sass `color.mix(white, $color, $weight)`.
 * Mixes white at the given weight (0–1) with the base color.
 */
function mixWithWhite(hex: string, weight: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    255 * weight + r * (1 - weight),
    255 * weight + g * (1 - weight),
    255 * weight + b * (1 - weight)
  );
}

/**
 * Generates a 12-step accent color scale matching the SCSS `generate-scale` mixin (accent type).
 */
export function generateAccentScale(
  baseHex: string
): Record<string, string> {
  return {
    "--accent-1": scaleColor(baseHex, -0.85, -0.6),
    "--accent-2": scaleColor(baseHex, -0.7, -0.3),
    "--accent-3": scaleColor(baseHex, -0.55, -0.1),
    "--accent-4": scaleColor(baseHex, -0.4, 0.05),
    "--accent-5": scaleColor(baseHex, -0.28, 0.06),
    "--accent-6": scaleColor(baseHex, -0.16, 0.04),
    "--accent-7": scaleColor(baseHex, -0.08, 0.02),
    "--accent-8": scaleColor(baseHex, -0.03, 0.01),
    "--accent-9": baseHex,
    "--accent-10": mixWithWhite(baseHex, 0.35),
    "--accent-11": mixWithWhite(baseHex, 0.65),
    "--accent-12": mixWithWhite(baseHex, 0.88),
  };
}

const ACCENT_VARS = Array.from({ length: 12 }, (_, i) => `--accent-${i + 1}`);

/**
 * Applies a custom accent color scale as inline CSS custom properties on the document root.
 */
export function applyCustomAccentScale(baseHex: string): void {
  const scale = generateAccentScale(baseHex);
  const style = document.documentElement.style;
  for (const [key, value] of Object.entries(scale)) {
    style.setProperty(key, value);
  }
}

/**
 * Removes all inline accent CSS custom properties so preset CSS rules take effect again.
 */
export function clearCustomAccentScale(): void {
  const style = document.documentElement.style;
  for (const key of ACCENT_VARS) {
    style.removeProperty(key);
  }
}
