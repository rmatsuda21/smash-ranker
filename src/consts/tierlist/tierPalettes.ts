import { msg } from "@lingui/core/macro";
import { type MessageDescriptor } from "@lingui/core";

export type TierPalette = {
  id: string;
  name: MessageDescriptor;
  colors: string[];
};

export const DEFAULT_PALETTE_ID = "classic";

export const TIER_PALETTES: TierPalette[] = [
  {
    id: "classic",
    name: msg`Classic`,
    colors: [
      "#ff7f7f", "#ffbf7f", "#ffdf7f", "#ffff7f", "#bfff7f",
      "#7fff7f", "#7fffff", "#7fbfff", "#bf7fff", "#ff7fbf",
    ],
  },
  {
    id: "pastel",
    name: msg`Pastel`,
    colors: [
      "#f4a0a0", "#f4c4a0", "#f4d8a0", "#f4f4a0", "#c8f4a0",
      "#a0f4b8", "#a0e8f4", "#a0c4f4", "#c4a0f4", "#f4a0d8",
    ],
  },
  {
    id: "warm",
    name: msg`Warm`,
    colors: [
      "#cc3333", "#d94e2a", "#e66a20", "#f28517", "#ff9f0e",
      "#ffb824", "#ffd03b", "#ffe052", "#ffec69", "#fff880",
    ],
  },
  {
    id: "cool",
    name: msg`Cool`,
    colors: [
      "#2e4a8a", "#2d5ea0", "#2c72b6", "#3388cc", "#3d9ec2",
      "#47b4b8", "#55c4a8", "#66d4a0", "#80dea0", "#99e8b0",
    ],
  },
  {
    id: "mono",
    name: msg`Monochrome`,
    colors: [
      "#e0e0e0", "#cccccc", "#b8b8b8", "#a4a4a4", "#909090",
      "#7c7c7c", "#686868", "#545454", "#404040", "#2c2c2c",
    ],
  },
  {
    id: "neon",
    name: msg`Neon`,
    colors: [
      "#ff073a", "#ff6b08", "#ffe808", "#39ff14", "#0ff0fc",
      "#1b6bff", "#b026ff", "#ff2cf0", "#ff6ec7", "#fffa65",
    ],
  },
  {
    id: "earth",
    name: msg`Earth`,
    colors: [
      "#8b5e3c", "#a0714b", "#b5845a", "#c49768", "#c8a87a",
      "#7a8b4a", "#6b8e5a", "#8faa6e", "#b8c48a", "#d4c9a0",
    ],
  },
  {
    id: "ocean",
    name: msg`Ocean`,
    colors: [
      "#0a2463", "#1e3a7a", "#325090", "#4668a8", "#5a80c0",
      "#5e9eb8", "#62bca0", "#72d4b0", "#88e8c8", "#a0f0dc",
    ],
  },
];

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (v: number) =>
    Math.round((v + m) * 255).toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getColorsForTierCount(
  palette: TierPalette,
  count: number
): string[] {
  if (count <= palette.colors.length) {
    return palette.colors.slice(0, count);
  }

  const colors = [...palette.colors];
  const lastTwo = [
    hexToHsl(palette.colors[palette.colors.length - 2]),
    hexToHsl(palette.colors[palette.colors.length - 1]),
  ];
  const dH = lastTwo[1][0] - lastTwo[0][0];
  const dS = lastTwo[1][1] - lastTwo[0][1];
  const dL = lastTwo[1][2] - lastTwo[0][2];

  for (let i = palette.colors.length; i < count; i++) {
    const step = i - palette.colors.length + 1;
    const h = lastTwo[1][0] + dH * step;
    const s = Math.max(0, Math.min(100, lastTwo[1][1] + dS * step));
    const l = Math.max(10, Math.min(90, lastTwo[1][2] + dL * step));
    colors.push(hslToHex(h, s, l));
  }

  return colors;
}
