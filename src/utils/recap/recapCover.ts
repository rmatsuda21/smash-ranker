import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

// What the cover says. Built by the slide, so every string is translated.
export type RecapCoverText = {
  issue: string;
  number: string;
  masthead: string;
  // Coverlines down the left: a headline number and a caption.
  lines: { value: string; caption: string }[];
  // Captions under the name, one bar each.
  bars: string[];
  // A coverline set vertically down the right edge (Japanese covers).
  vertical: string | null;
  stickerLabel: string;
  stickerName: string;
  strap: string;
  tag: string;
  site: string;
};

export type RecapCoverAssets = {
  art: HTMLImageElement | null;
};

export const COVER_WIDTH = 1080;
export const COVER_HEIGHT = 1920;

const DISPLAY_FONT = '"Big Shoulders Display", "M PLUS Rounded 1c", sans-serif';
const TEXT_FONT = '"M PLUS Rounded 1c", sans-serif';
const INK = "#0e0d13";
const BLUE = "#2740ff";
const YELLOW = "#ffd60a";
const PINK = "#e93d82";
// The layout is in hundredths of the story's width, of which the cover takes
// 88: one unit here is one `cqw` on screen.
const U = COVER_WIDTH / 88;
// When the last layer has landed, in seconds.
export const COVER_INTRO_SECONDS = 2.6;

const loadImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const image = new Image();
    // Drawn to a canvas that is exported, so it must not taint it.
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

export const loadRecapCoverAssets = async (
  characterId: string | null,
  text: RecapCoverText,
): Promise<RecapCoverAssets> => {
  const sample = [
    text.masthead,
    text.tag,
    text.stickerName,
    ...text.lines.map((line) => line.value + line.caption),
    ...text.bars,
    text.vertical ?? "",
  ].join("");
  const [art] = await Promise.all([
    characterId ? loadImage(getCharImgUrl({ characterId })) : null,
    // The canvas falls back silently to another face if these are not in.
    document.fonts.load(`900 100px ${DISPLAY_FONT}`, sample).catch(() => null),
    document.fonts.load(`800 40px ${TEXT_FONT}`, sample).catch(() => null),
  ]);
  return { art };
};

// How far a layer is into its entrance at `time`, eased, 0–1.
const entrance = (time: number, start: number, duration: number): number => {
  const raw = Math.min(1, Math.max(0, (time - start) / duration));
  return 1 - (1 - raw) ** 3;
};

const display = (size: number) => `900 ${size * U}px ${DISPLAY_FONT}`;
const body = (size: number) => `800 ${size * U}px ${TEXT_FONT}`;

// White text on an ink bar that hugs it; returns the bar's height.
const drawBar = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = "#fff",
): number => {
  ctx.font = body(3.2);
  const width = ctx.measureText(text).width + 4 * U;
  const height = 5.4 * U;
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(text, x + 2 * U, y + height / 2 + 0.1 * U);
  return height;
};

// Breaks `text` into lines no wider than `maxWidth`, at spaces where it has
// them and between characters where it does not (Japanese).
const wrap = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] => {
  const pieces = text.includes(" ") ? text.split(" ") : [...text];
  const joiner = text.includes(" ") ? " " : "";
  const lines: string[] = [];
  let line = "";
  for (const piece of pieces) {
    const next = line ? line + joiner + piece : piece;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = piece;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
};

// Draws the cover at COVER_WIDTH × COVER_HEIGHT. `time` (seconds since the
// slide appeared) plays the layers in one after another; left out, the cover
// is drawn finished, which is what the shared image is.
export const drawRecapCover = (
  ctx: CanvasRenderingContext2D,
  text: RecapCoverText,
  assets: RecapCoverAssets,
  time = Infinity,
) => {
  ctx.save();
  ctx.clearRect(0, 0, COVER_WIDTH, COVER_HEIGHT);
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);

  // Issue line.
  ctx.font = body(2.9);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(text.issue, 4 * U, 3.4 * U);
  ctx.textAlign = "right";
  ctx.fillText(text.number, COVER_WIDTH - 4 * U, 3.4 * U);

  // Masthead, sized to span the cover.
  const mast = entrance(time, 0.15, 0.5);
  ctx.save();
  ctx.translate(0, -(1 - mast) * 40 * U);
  ctx.font = display(10);
  const mastSize = Math.min(
    34,
    (10 * 80 * U) / ctx.measureText(text.masthead).width,
  );
  ctx.font = display(mastSize);
  ctx.fillStyle = YELLOW;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text.masthead, 3 * U, 8 * U + mastSize * 0.74 * U);
  ctx.restore();

  // The cover star stands over the masthead.
  if (assets.art) {
    const rise = entrance(time, 0.4, 0.7);
    const height = 140 * U;
    const width = (assets.art.width / assets.art.height) * height;
    ctx.save();
    ctx.globalAlpha = rise;
    ctx.drawImage(
      assets.art,
      COVER_WIDTH - width + 35 * U,
      22 * U + (1 - rise) * 40 * U,
      width,
      height,
    );
    ctx.restore();
  }

  // Coverlines.
  let y = 39 * U;
  text.lines.forEach((line, index) => {
    const slide = entrance(time, 0.9 + index * 0.13, 0.45);
    ctx.save();
    ctx.globalAlpha = slide;
    ctx.translate(-(1 - slide) * 14 * U, 0);
    ctx.font = display(13);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const baseline = y + 10.4 * U;
    ctx.lineJoin = "round";
    ctx.lineWidth = 1.3 * U;
    ctx.strokeStyle = INK;
    ctx.strokeText(line.value, 4 * U, baseline);
    ctx.fillStyle = YELLOW;
    ctx.fillText(line.value, 4 * U, baseline);
    drawBar(ctx, line.caption, 4 * U, y + 12.4 * U);
    ctx.restore();
    y += 21.5 * U;
  });

  // Vertical coverline.
  if (text.vertical) {
    const rise = entrance(time, 1.5, 0.5);
    const size = 3.6 * U;
    const step = size * 1.12;
    const chars = [...text.vertical];
    const barWidth = 6.4 * U;
    const barHeight = chars.length * step + 5 * U;
    const x = COVER_WIDTH - 3 * U - barWidth;
    const top = 80 * U + (1 - rise) * 7 * U;
    ctx.save();
    ctx.globalAlpha = rise;
    ctx.fillStyle = INK;
    ctx.fillRect(x, top, barWidth, barHeight);
    ctx.font = body(3.6);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    chars.forEach((char, index) => {
      ctx.fillText(
        char,
        x + barWidth / 2,
        top + 2.5 * U + step * (index + 0.5),
      );
    });
    ctx.restore();
  }

  // Name block, built up from the bottom edge.
  const nameIn = entrance(time, 1.3, 0.5);
  ctx.save();
  ctx.globalAlpha = nameIn;
  ctx.translate(0, (1 - nameIn) * 7 * U);
  ctx.font = body(3.2);
  const barLines = text.bars.flatMap((bar) => wrap(ctx, bar, 52 * U));
  let bottom = COVER_HEIGHT - 4 * U;
  [...barLines].reverse().forEach((line) => {
    bottom -= 5.4 * U;
    drawBar(ctx, line, 4 * U, bottom);
    bottom -= 0.6 * U;
  });
  ctx.font = display(10);
  const tag = text.tag.toUpperCase();
  const tagSize = Math.min(27, (10 * 56 * U) / ctx.measureText(tag).width);
  ctx.font = display(tagSize);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const tagBaseline = bottom - 2.4 * U;
  ctx.fillStyle = INK;
  ctx.fillText(tag, 4.9 * U, tagBaseline + 0.9 * U);
  ctx.fillStyle = "#fff";
  ctx.fillText(tag, 4 * U, tagBaseline);
  drawBar(
    ctx,
    text.strap,
    4 * U,
    tagBaseline - tagSize * 0.74 * U - 7.4 * U,
    YELLOW,
  );
  ctx.restore();

  // Player type sticker.
  const stamp = entrance(time, 1.8, 0.45);
  if (stamp > 0) {
    const radius = 17 * U;
    ctx.save();
    ctx.translate(
      COVER_WIDTH - (text.vertical ? 30 : 23) * U,
      COVER_HEIGHT - 53 * U,
    );
    ctx.rotate((10 * Math.PI) / 180);
    ctx.scale(2.6 - 1.6 * stamp, 2.6 - 1.6 * stamp);
    ctx.globalAlpha = stamp;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const r = i % 2 ? radius * 0.88 : radius;
      const angle = (i / 40) * Math.PI * 2;
      ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
    }
    ctx.closePath();
    ctx.fillStyle = PINK;
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const words = text.stickerName.toUpperCase().split(" ");
    ctx.font = display(7.5);
    const widest = Math.max(...words.map((w) => ctx.measureText(w).width));
    const size = Math.min(7.5, (7.5 * 25 * U) / widest);
    const lineHeight = size * 0.92 * U;
    const blockTop = -((words.length * lineHeight) / 2) + 1.6 * U;
    ctx.font = body(2.8);
    ctx.fillText(text.stickerLabel, 0, blockTop - 1.4 * U);
    ctx.font = display(size);
    words.forEach((word, index) => {
      ctx.fillText(word, 0, blockTop + lineHeight * (index + 0.86));
    });
    ctx.restore();
  }

  // Barcode.
  const code = entrance(time, 2.1, 0.3);
  if (code > 0) {
    const width = 23 * U;
    const height = 13 * U;
    const x = COVER_WIDTH - 4 * U - width;
    const top = COVER_HEIGHT - 4 * U - height;
    ctx.save();
    ctx.globalAlpha = code;
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, top, width, height);
    ctx.fillStyle = INK;
    const widths = [0.5, 0.9, 0.3, 0.5, 0.9, 0.4, 0.3, 0.7];
    let barX = x + 1.6 * U;
    for (let i = 0; barX < x + width - 2 * U; i++) {
      const w = widths[i % widths.length] * U;
      if (i % 2 === 0) ctx.fillRect(barX, top + 1.6 * U, w, 8 * U);
      barX += w;
    }
    ctx.font = body(2.1);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text.site, x + width / 2, top + height - 1.1 * U);
    ctx.restore();
  }

  ctx.restore();
};

// The finished cover as a PNG, for sharing.
export const renderRecapCoverImage = (
  text: RecapCoverText,
  assets: RecapCoverAssets,
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = COVER_WIDTH;
    canvas.height = COVER_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("no canvas context"));
      return;
    }
    drawRecapCover(ctx, text, assets);
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("cover export failed")),
      "image/png",
    );
  });
