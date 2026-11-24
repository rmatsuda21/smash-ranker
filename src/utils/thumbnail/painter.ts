import {
  THUMBNAIL_HEIGHT,
  THUMBNAIL_WIDTH,
} from "@/consts/thumbnail/thumbnail";
import type {
  ThumbnailLook,
  ThumbnailMatch,
  ThumbnailSide,
} from "@/types/thumbnail/Thumbnail";
import { pickWeight } from "@/utils/fonts/fontLoader";

// What one thumbnail shows. `logoSrc` is the uploaded logo or, without one,
// the event's icon.
export type ThumbnailScene = {
  match: ThumbnailMatch;
  look: ThumbnailLook;
  logoSrc: string | null;
};

export type ThumbnailAssets = {
  art: [HTMLImageElement | null, HTMLImageElement | null];
  logo: HTMLImageElement | null;
};

export type Rect = { x: number; y: number; w: number; h: number };

// Handed to a template: the canvas, already scaled so that the template
// draws in 1280×720 whatever the canvas's real size.
export type Painter = {
  ctx: CanvasRenderingContext2D;
  scene: ThumbnailScene;
  assets: ThumbnailAssets;
  // Canvas pixels per template pixel, for the few settings (shadows) that
  // ignore the canvas transform.
  scale: number;
  family: string;
  weight: number;
};

export const W = THUMBNAIL_WIDTH;
export const H = THUMBNAIL_HEIGHT;
export const NIGHT = "#0b0b10";
export const PAPER = "#ffffff";

const parseHex = (hex: string): [number, number, number] => {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const n = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const withAlpha = (hex: string, alpha: number): string => {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Dark or white lettering, whichever reads on the colour.
export const inkOn = (hex: string): string => {
  const [r, g, b] = parseHex(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? NIGHT : PAPER;
};

export const poly = (ctx: CanvasRenderingContext2D, points: number[][]) => {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};

export const fillPoly = (
  ctx: CanvasRenderingContext2D,
  points: number[][],
  fill: string,
) => {
  poly(ctx, points);
  ctx.fillStyle = fill;
  ctx.fill();
};

const setFont = (p: Painter, size: number) => {
  p.ctx.font = `${p.weight} ${size}px ${p.family}`;
};

// The largest size, up to `max`, at which the text fits the width.
const fitSize = (
  p: Painter,
  text: string,
  maxWidth: number,
  max: number,
  min: number,
): number => {
  setFont(p, max);
  const width = p.ctx.measureText(text).width;
  if (width <= maxWidth) return max;
  return Math.max(min, Math.floor((max * maxWidth) / width));
};

export type TextOptions = {
  x: number;
  y: number;
  maxWidth: number;
  size: number;
  minSize?: number;
  align?: CanvasTextAlign;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  // Draws the outline only.
  hollow?: boolean;
};

// One line, shrunk to fit; past `minSize` it is squeezed instead.
export const drawText = (p: Painter, text: string, o: TextOptions): number => {
  if (!text) return 0;
  const { ctx } = p;
  const size = fitSize(p, text, o.maxWidth, o.size, o.minSize ?? 20);
  setFont(p, size);
  ctx.textAlign = o.align ?? "center";
  ctx.textBaseline = "middle";
  if (o.stroke) {
    ctx.lineJoin = "round";
    ctx.lineWidth = ((o.strokeWidth ?? 12) * size) / o.size;
    ctx.strokeStyle = o.stroke;
    ctx.strokeText(text, o.x, o.y, o.maxWidth);
  }
  if (!o.hollow) {
    ctx.fillStyle = o.fill;
    ctx.fillText(text, o.x, o.y, o.maxWidth);
  }
  return size;
};

// A player's name with the sponsor before it in a quieter colour.
export const drawName = (
  p: Painter,
  side: ThumbnailSide,
  o: TextOptions & { sponsorFill: string },
) => {
  const { ctx } = p;
  const name = side.name.trim();
  const sponsor = side.sponsor.trim();
  if (!sponsor) {
    drawText(p, name, o);
    return;
  }

  const full = `${sponsor} ${name}`;
  const size = fitSize(p, full, o.maxWidth, o.size, o.minSize ?? 20);
  setFont(p, size);
  const fullWidth = ctx.measureText(full).width;
  // Still too wide at the smallest size: the name alone, squeezed.
  if (fullWidth > o.maxWidth) {
    drawText(p, name, o);
    return;
  }
  const lead = ctx.measureText(`${sponsor} `).width;
  const align = o.align ?? "center";
  const start =
    align === "center"
      ? o.x - fullWidth / 2
      : align === "right"
        ? o.x - fullWidth
        : o.x;
  const scaled = { ...o, size, align: "left" as const, maxWidth: fullWidth };
  drawText(p, sponsor, { ...scaled, x: start, fill: o.sponsorFill });
  drawText(p, name, { ...scaled, x: start + lead });
};

type ArtOptions = {
  // Path to clip the art to, when it is not the box itself.
  clip?: () => void;
  // Colour of a hard drop shadow thrown away from the centre line.
  shadow?: string;
  // Colour of a soft glow around the art.
  glow?: string;
};

// The part of a render that has something drawn in it, in the image's own
// pixels. Renders come on canvases of very different sizes with the figure
// anywhere inside, so fitting the whole file leaves some characters small.
const artBounds = new WeakMap<HTMLImageElement, Rect>();
const BOUNDS_SAMPLE = 192;
// Faint pixels (soft edges, stray specks) do not count as the figure.
const BOUNDS_ALPHA = 24;

const getArtBounds = (image: HTMLImageElement): Rect => {
  const known = artBounds.get(image);
  if (known) return known;
  const whole = { x: 0, y: 0, w: image.width, h: image.height };
  let bounds = whole;
  try {
    const step = Math.max(image.width, image.height) / BOUNDS_SAMPLE;
    const w = Math.max(1, Math.round(image.width / step));
    const h = Math.max(1, Math.round(image.height / step));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(image, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      let left = w;
      let top = h;
      let right = -1;
      let bottom = -1;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] < BOUNDS_ALPHA) continue;
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
      if (right >= left && bottom >= top) {
        bounds = {
          x: left * step,
          y: top * step,
          w: Math.min(image.width, (right + 1) * step) - left * step,
          h: Math.min(image.height, (bottom + 1) * step) - top * step,
        };
      }
    }
  } catch {
    // An image that cannot be read back is fitted whole.
    bounds = whole;
  }
  artBounds.set(image, bounds);
  return bounds;
};

// A player's character in its box: the figure itself (not the file it comes
// in) about as tall as the box, or wider than it by a quarter when the pose
// is a broad one, then moved and resized as the player's settings say.
export const drawArt = (
  p: Painter,
  index: 0 | 1,
  box: Rect,
  options: ArtOptions = {},
) => {
  const { ctx } = p;
  const side = p.scene.match.sides[index];
  const image = p.assets.art[index];

  ctx.save();
  if (options.clip) {
    options.clip();
  } else {
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
  }
  ctx.clip();

  const cx = box.x + box.w * (0.5 + side.offset.x);
  const cy = box.y + box.h * (0.54 + side.offset.y);

  if (!image) {
    // No art to draw: an unknown character, or art that failed to load.
    ctx.globalAlpha = 0.35;
    drawText(p, "?", {
      x: cx,
      y: box.y + box.h * (0.5 + side.offset.y),
      maxWidth: box.w,
      size: box.h * 0.6 * side.zoom,
      fill: PAPER,
    });
    ctx.restore();
    return;
  }

  const figure = getArtBounds(image);
  const scale =
    Math.min((box.h * 1.04) / figure.h, (box.w * 1.25) / figure.w) * side.zoom;
  // The figure's middle goes on the point, not the file's.
  const dx = -(figure.x + figure.w / 2) * scale;
  const dy = -(figure.y + figure.h / 2) * scale;
  // Both sides are drawn as the art comes; a side is mirrored only when asked.
  const mirrored = side.flip;

  ctx.translate(cx, cy);
  if (mirrored) ctx.scale(-1, 1);
  if (options.shadow) {
    ctx.shadowColor = options.shadow;
    ctx.shadowOffsetX = (index === 0 ? 16 : -16) * p.scale;
    ctx.shadowOffsetY = 12 * p.scale;
  } else if (options.glow) {
    ctx.shadowColor = options.glow;
    ctx.shadowBlur = 48 * p.scale;
  }
  ctx.drawImage(image, dx, dy, image.width * scale, image.height * scale);
  ctx.restore();
};

// The logo, fitted inside a square of `size` centred on the point, with its
// corners rounded. Nothing is drawn behind it, so a logo that is not square
// keeps its own shape.
export const drawLogo = (p: Painter, cx: number, cy: number, size: number) => {
  const { ctx } = p;
  const { logo } = p.assets;
  if (!logo) return;
  const scale = Math.min(size / logo.width, size / logo.height);
  const w = logo.width * scale;
  const h = logo.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, Math.min(w, h) * 0.16);
  ctx.clip();
  ctx.drawImage(logo, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
};

// The lettering's font: the chosen family at the heaviest weight it ships.
export const thumbnailFont = (font: string) => ({
  family: `"${font}", "M PLUS Rounded 1c", sans-serif`,
  weight: pickWeight(font, 900),
});
