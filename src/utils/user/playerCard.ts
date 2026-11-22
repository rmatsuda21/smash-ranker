import type { AuthUser } from "@/types/user/AuthUser";
import type { CareerStats, SetStats } from "@/utils/user/careerStats";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

// What the player card shows, already worded: the painter knows nothing
// about start.gg or translations.
export type PlayerCardData = {
  tag: string;
  prefix: string | null;
  // The player's start.gg user id, printed as the card's number.
  number: string;
  place: string | null;
  // Big faint number behind the art.
  ghost: string;
  stats: { value: string; label: string }[];
  // Character ids, most played first. The first is the card's art.
  characterIds: string[];
};

export type PlayerCardLabels = {
  events: string;
  wins: string;
  top8: string;
  sets: string;
  top3: string;
};

const MAX_CHARACTERS = 3;

export const buildPlayerCardData = (
  user: AuthUser,
  career: CareerStats,
  setStats: SetStats,
  labels: PlayerCardLabels,
): PlayerCardData => ({
  tag: user.gamerTag,
  prefix: user.prefix,
  number: user.id,
  place: [user.city, user.state].filter(Boolean).join(", ") || user.country,
  ghost: String(career.top8s || career.tournamentCount),
  stats: [
    { value: String(career.tournamentCount), label: labels.events },
    { value: String(career.wins), label: labels.wins },
    { value: String(career.top8s), label: labels.top8 },
    // No sets with a result (or none loaded): podiums take the last slot.
    setStats.wins + setStats.losses > 0
      ? {
          // To one decimal: a whole number hides most of a season's change.
          value: `${((setStats.wins / (setStats.wins + setStats.losses)) * 100).toFixed(1)}%`,
          label: labels.sets,
        }
      : { value: String(career.podiums), label: labels.top3 },
  ],
  characterIds: setStats.characters.slice(0, MAX_CHARACTERS).map((c) => c.id),
});

export type PlayerCardAssets = {
  art: HTMLImageElement | null;
  stocks: HTMLImageElement[];
  // Hue of the card's ground, taken from the art.
  hue: number;
};

export const CARD_WIDTH = 1000;
export const CARD_HEIGHT = 1400;
export const CARD_FONT =
  '"Big Shoulders Display", "M PLUS Rounded 1c", sans-serif';
const TEXT_FONT = '"M PLUS Rounded 1c", sans-serif';
const INK = "#fff8ee";
const NIGHT = "13, 10, 31";
// The app's brand pink, for a card with no art to take a colour from.
const DEFAULT_HUE = 336;

const loadImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const image = new Image();
    // Drawn to a canvas that is exported, so it must not taint it.
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

// The average hue of the art's opaque pixels, weighted towards the
// saturated ones so a grey outfit doesn't wash the colour out.
const dominantHue = (image: HTMLImageElement): number => {
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return DEFAULT_HUE;
  ctx.drawImage(image, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  // Hues are angles: average them as vectors.
  let x = 0;
  let y = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const delta = max - Math.min(r, g, b);
    if (delta < 0.15) continue;
    let hue =
      max === r
        ? ((g - b) / delta) % 6
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4;
    hue *= Math.PI / 3;
    x += Math.cos(hue) * delta;
    y += Math.sin(hue) * delta;
  }
  if (x === 0 && y === 0) return DEFAULT_HUE;
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

export const loadPlayerCardAssets = async (
  data: PlayerCardData,
): Promise<PlayerCardAssets> => {
  const text = `${data.tag}${data.ghost}${data.stats.map((s) => s.value + s.label).join("")}`;
  const [art, stocks] = await Promise.all([
    data.characterIds[0]
      ? loadImage(getCharImgUrl({ characterId: data.characterIds[0] }))
      : null,
    Promise.all(
      data.characterIds.map((characterId) =>
        loadImage(getCharImgUrl({ characterId, type: "stock" })),
      ),
    ),
    // The canvas falls back silently to another face if these are not in.
    document.fonts.load(`900 100px ${CARD_FONT}`, text).catch(() => null),
    document.fonts.load(`800 100px ${CARD_FONT}`, text).catch(() => null),
    document.fonts
      .load(`800 40px ${TEXT_FONT}`, `${text}${data.place ?? ""}`)
      .catch(() => null),
  ]);

  return {
    art,
    stocks: stocks.filter((image): image is HTMLImageElement => image !== null),
    hue: art ? dominantHue(art) : DEFAULT_HUE,
  };
};

const spaced = (ctx: CanvasRenderingContext2D, spacing: string) => {
  // Not in every browser; the labels just sit tighter without it.
  if ("letterSpacing" in ctx) ctx.letterSpacing = spacing;
};

// Draws the card face at CARD_WIDTH × CARD_HEIGHT. `foil` bakes a still of
// the shimmer in, for an exported image; on screen the shimmer is CSS on top
// of the plain face, so it can move.
export const drawPlayerCard = (
  ctx: CanvasRenderingContext2D,
  data: PlayerCardData,
  assets: PlayerCardAssets,
  { foil = false }: { foil?: boolean } = {},
) => {
  const W = CARD_WIDTH;
  const H = CARD_HEIGHT;
  // One hundredth of the width: the unit the layout is written in.
  const u = W / 100;
  const { hue } = assets;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 5 * u);
  ctx.clip();

  // Ground: the art's colour, falling off into night.
  const ground = ctx.createRadialGradient(
    0.7 * W,
    0.2 * H,
    0,
    0.7 * W,
    0.2 * H,
    1.2 * H,
  );
  ground.addColorStop(0, `hsl(${hue} 72% 46%)`);
  ground.addColorStop(0.36, `hsl(${(hue + 345) % 360} 66% 25%)`);
  ground.addColorStop(0.75, "#1b1136");
  ground.addColorStop(1, "#0d0a1f");
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "alphabetic";
  ctx.font = `900 ${66 * u}px ${CARD_FONT}`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
  ctx.fillText(data.ghost, -2 * u, 58 * u);

  if (assets.art) {
    const { art } = assets;
    const scale = Math.min(
      (108 * u) / art.naturalWidth,
      (125 * u) / art.naturalHeight,
    );
    const w = art.naturalWidth * scale;
    const h = art.naturalHeight * scale;

    // Fade the art out towards the name, on a layer of its own.
    const layer = document.createElement("canvas");
    layer.width = W;
    layer.height = H;
    const layerCtx = layer.getContext("2d");
    if (layerCtx) {
      layerCtx.drawImage(art, 62 * u - w / 2, 2 * u, w, h);
      const fade = layerCtx.createLinearGradient(0, 70 * u, 0, 98 * u);
      fade.addColorStop(0, "#000");
      fade.addColorStop(1, "transparent");
      layerCtx.globalCompositeOperation = "destination-in";
      layerCtx.fillStyle = fade;
      layerCtx.fillRect(0, 0, W, H);
      ctx.drawImage(layer, 0, 0);
    }
  }

  // Keeps the text readable over bright art.
  const shade = ctx.createLinearGradient(0, 0.55 * H, 0, H);
  shade.addColorStop(0, `rgba(${NIGHT}, 0)`);
  shade.addColorStop(1, `rgba(${NIGHT}, 0.6)`);
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255, 236, 200, 0.55)";
  ctx.lineWidth = 0.5 * u;
  ctx.beginPath();
  ctx.roundRect(3 * u, 3 * u, W - 6 * u, H - 6 * u, 3 * u);
  ctx.stroke();

  // Chips along the top: sponsor prefix left, card number right.
  const chip = (text: string, align: "left" | "right") => {
    ctx.font = `800 ${3.1 * u}px ${TEXT_FONT}`;
    spaced(ctx, `${0.25 * u}px`);
    const width = ctx.measureText(text).width + 4.8 * u;
    const height = 5.4 * u;
    const x = align === "left" ? 7 * u : W - 7 * u - width;
    const y = 6.5 * u;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, height / 2);
    ctx.fillStyle = `rgba(${NIGHT}, 0.6)`;
    ctx.fill();
    ctx.lineWidth = 0.3 * u;
    ctx.strokeStyle = "rgba(255, 236, 200, 0.5)";
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + 2.4 * u, y + height / 2 + 0.1 * u);
    spaced(ctx, "0px");
  };
  if (data.prefix) chip(data.prefix, "left");
  chip(`No. ${data.number}`, "right");

  // The plate, laid out from the bottom edge up.
  const left = 7 * u;
  const right = W - 7 * u;
  const width = right - left;
  let y = H - 6.5 * u;

  // Stats: value over label, four across.
  const column = width / data.stats.length;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  data.stats.forEach((stat, i) => {
    const x = left + column * i;
    ctx.font = `800 ${2.5 * u}px ${TEXT_FONT}`;
    spaced(ctx, `${0.25 * u}px`);
    ctx.fillStyle = "rgba(255, 248, 238, 0.8)";
    ctx.fillText(stat.label.toUpperCase(), x, y, column - 2 * u);
    spaced(ctx, "0px");
    ctx.font = `800 ${8.6 * u}px ${CARD_FONT}`;
    ctx.fillStyle = INK;
    ctx.fillText(stat.value, x, y - 3.6 * u, column - 2 * u);
  });
  y -= 11.4 * u;

  y -= 2.4 * u;
  ctx.fillStyle = "rgba(255, 236, 200, 0.45)";
  ctx.fillRect(left, y, width, 0.3 * u);
  y -= 2.4 * u;

  // Where the player is from, and who they play.
  const icon = 6.4 * u;
  let iconX = right;
  for (const stock of [...assets.stocks].reverse()) {
    iconX -= icon;
    ctx.drawImage(stock, iconX, y - icon, icon, icon);
    iconX -= 2 * u;
  }
  if (data.place) {
    ctx.font = `800 ${3.5 * u}px ${TEXT_FONT}`;
    ctx.fillStyle = INK;
    ctx.textBaseline = "middle";
    ctx.fillText(data.place, left, y - icon / 2, iconX - left);
    ctx.textBaseline = "alphabetic";
  }
  y -= icon + 3 * u;

  // The tag, as large as fits on one line.
  const tag = data.tag.toUpperCase();
  let size = 21 * u;
  ctx.font = `900 ${size}px ${CARD_FONT}`;
  const measured = ctx.measureText(tag).width;
  if (measured > width) {
    size = Math.max(8 * u, (size * width) / measured);
    ctx.font = `900 ${size}px ${CARD_FONT}`;
  }
  ctx.fillStyle = `rgba(${NIGHT}, 0.55)`;
  ctx.fillText(tag, left, y + 0.6 * u, width);
  ctx.fillStyle = INK;
  ctx.fillText(tag, left, y, width);

  if (foil) {
    const rainbow = ctx.createLinearGradient(0, 0, W, H * 0.6);
    const colours = [
      "#ff5a5a",
      "#ffd84d",
      "#6dff8e",
      "#4de3ff",
      "#7d7bff",
      "#ff6ae6",
    ];
    for (let i = 0; i <= 12; i++) {
      rainbow.addColorStop(i / 12, colours[i % colours.length]);
    }
    ctx.globalCompositeOperation = "color-dodge";
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = rainbow;
    ctx.fillRect(0, 0, W, H);

    const glare = ctx.createRadialGradient(
      0.32 * W,
      0.26 * H,
      0,
      0.32 * W,
      0.26 * H,
      H,
    );
    glare.addColorStop(0, "rgba(255, 255, 255, 0.7)");
    glare.addColorStop(0.32, "rgba(255, 255, 255, 0.1)");
    glare.addColorStop(1, "rgba(0, 0, 0, 0.35)");
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = glare;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  ctx.restore();
};

const SHARE_WIDTH = 1080;
const SHARE_HEIGHT = 1350;
const SHARE_CARD_WIDTH = 820;

// The image that gets posted: the card with its foil caught mid-shine, on a
// 4:5 backdrop (the tallest shape a feed shows uncropped).
export const renderPlayerCardImage = (
  data: PlayerCardData,
  assets: PlayerCardAssets,
): Promise<Blob> => {
  const face = document.createElement("canvas");
  face.width = CARD_WIDTH;
  face.height = CARD_HEIGHT;
  const faceCtx = face.getContext("2d");

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_WIDTH;
  canvas.height = SHARE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx || !faceCtx) return Promise.reject(new Error("No 2D canvas"));

  drawPlayerCard(faceCtx, data, assets, { foil: true });

  const backdrop = ctx.createRadialGradient(
    SHARE_WIDTH / 2,
    SHARE_HEIGHT * 0.45,
    0,
    SHARE_WIDTH / 2,
    SHARE_HEIGHT * 0.45,
    SHARE_HEIGHT * 0.8,
  );
  backdrop.addColorStop(0, `hsl(${assets.hue} 40% 20%)`);
  backdrop.addColorStop(1, "#0b0914");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, SHARE_WIDTH, SHARE_HEIGHT);

  const cardHeight = (SHARE_CARD_WIDTH * CARD_HEIGHT) / CARD_WIDTH;
  const x = (SHARE_WIDTH - SHARE_CARD_WIDTH) / 2;
  const y = 70;
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 30;
  ctx.drawImage(face, x, y, SHARE_CARD_WIDTH, cardHeight);
  ctx.restore();

  ctx.font = `800 30px ${TEXT_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255, 248, 238, 0.6)";
  ctx.fillText(
    "smash-ranker.app",
    SHARE_WIDTH / 2,
    (y + cardHeight + SHARE_HEIGHT) / 2,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      "image/png",
    );
  });
};
