import "./_instrument.js";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import React from "react";

import { BadRequestError, respondClientError } from "./_lib/errors.js";
import { parseBase64UrlPayload, parseImageUrl } from "./_lib/validate.js";
import { addBreadcrumb, withLogging } from "./_lib/withLogging.js";

const MAX_PAYLOAD_BYTES = 8 * 1024;
const MAX_PREDICTIONS = 16;
const MAX_FIELD_LENGTH = 256;

// Cached at module scope for warm starts
const fontRegular = readFileSync(
  join(__dirname, "fonts/MPLUSRounded1c-Regular.ttf"),
);
const fontBold = readFileSync(
  join(__dirname, "fonts/MPLUSRounded1c-ExtraBold.ttf"),
);

const WIDTH = 275;
const OUTPUT_WIDTH = 550; // 2x pixel ratio for rasterization

const h = React.createElement;

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

// Tournament icons vary per request; cap with insertion-order LRU eviction.
const TOURNAMENT_ICON_CACHE_MAX = 64;
const tournamentIconCache = new Map<string, string>();

// Flag cache (per-country-code base64 PNG, decoded from bundled SVGs).
const FLAG_CACHE_MAX = 280;
const flagCache = new Map<string, string>();

// Final-PNG cache, keyed by sha256(canonical payload). Skips satori+resvg
// entirely on a hit. Bounded to keep memory in check.
const PNG_CACHE_MAX = 64;
const pngCache = new Map<string, Buffer>();

function lruGet<V>(cache: Map<string, V>, key: string): V | undefined {
  const value = cache.get(key);
  if (value !== undefined) {
    cache.delete(key);
    cache.set(key, value);
  }
  return value;
}

function lruSet<V>(cache: Map<string, V>, key: string, value: V, max: number) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  if (cache.size > max) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

type PredictionPlayer = {
  id: string;
  name: string;
  prefix?: string;
  country?: string;
};

// Duplicated locally — `api/` is built independently from `src/`, so we don't
// import the shared type to keep this function self-contained.
type PredictionPalette = {
  bgGradientStart: string;
  bgGradientEnd: string;
  accent: string;
  accentRowBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFooter: string;
  borderSubtle: string;
};

const DEFAULT_PALETTE: PredictionPalette = {
  bgGradientStart: "#1e1e3a",
  bgGradientEnd: "#14142a",
  accent: "#7c5cbf",
  accentRowBg: "rgba(124, 92, 191, 0.28)",
  textPrimary: "#ffffff",
  textSecondary: "#e8e8f0",
  textMuted: "#8888aa",
  textFooter: "#4a4a60",
  borderSubtle: "rgba(255, 255, 255, 0.06)",
};

type RequestBody = {
  tournamentName: string;
  eventName: string;
  tournamentDate: string;
  tournamentIconUrl: string;
  predictions: PredictionPlayer[];
  palette?: PredictionPalette;
  locale?: string;
};

type SubtitleStyle = { text: string; letterSpacing: number };

const SUBTITLE_BY_LOCALE: Record<string, SubtitleStyle> = {
  ja: { text: "順位予想", letterSpacing: 0 },
};
const DEFAULT_SUBTITLE: SubtitleStyle = {
  text: "PREDICTIONS",
  letterSpacing: 2,
};

function resolveSubtitle(locale: string | undefined): SubtitleStyle {
  if (!locale) return DEFAULT_SUBTITLE;
  return (
    SUBTITLE_BY_LOCALE[locale] ??
    SUBTITLE_BY_LOCALE[locale.split("-")[0]] ??
    DEFAULT_SUBTITLE
  );
}

// --- Image fetching ---

const FETCH_TIMEOUT_MS = 1500;

async function fetchImageAsDataUrl(
  url: string,
  retries = 1,
): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") || "image/png";
      return `data:${contentType};base64,${buf.toString("base64")}`;
    } catch {
      // retry
    }
  }
  console.warn(
    `[prediction-image] fetch failed after ${retries + 1} attempts: ${url}`,
  );
  return null;
}

async function fetchTournamentIcon(
  tournamentIconUrl: string,
): Promise<string | null> {
  if (!tournamentIconUrl) return null;
  const cached = lruGet(tournamentIconCache, tournamentIconUrl);
  if (cached) return cached;
  const fetched = await fetchImageAsDataUrl(tournamentIconUrl);
  if (fetched) {
    lruSet(
      tournamentIconCache,
      tournamentIconUrl,
      fetched,
      TOURNAMENT_ICON_CACHE_MAX,
    );
  }
  return fetched;
}

// Flag SVGs are bundled via vercel.json `includeFiles: public/assets/flags/**`.
// Decode SVG → PNG via sharp; satori v0.26 handles PNG reliably but trips on
// SVGs in some cases.
async function fetchFlag(countryCode: string): Promise<string | null> {
  const cc = countryCode.toLowerCase();
  if (!/^[a-z]{2}$/.test(cc)) return null;
  const cached = lruGet(flagCache, cc);
  if (cached) return cached;

  try {
    const path = join(process.cwd(), "public", "assets", "flags", `${cc}.svg`);
    const svgBuf = readFileSync(path);
    const pngBuf = await sharp(svgBuf, { density: 192 })
      .resize(24, 16, { fit: "cover" })
      .png()
      .toBuffer();
    const dataUrl = `data:image/png;base64,${pngBuf.toString("base64")}`;
    lruSet(flagCache, cc, dataUrl, FLAG_CACHE_MAX);
    return dataUrl;
  } catch {
    return null;
  }
}

async function preloadFlags(
  codes: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const unique = new Set<string>();
  for (const code of codes) {
    if (code) unique.add(code.toLowerCase());
  }
  const map = new Map<string, string>();
  await Promise.all(
    Array.from(unique).map(async (cc) => {
      const data = await fetchFlag(cc);
      if (data) map.set(cc, data);
    }),
  );
  return map;
}

// --- Placements ---

// Standard tournament placement pattern: 1, 2, 3, 4, 5, 5, 7, 7, 9, 9, 9, 9, ...
// Duplicated from src/utils/placements.ts because api/ functions don't share
// the client tsconfig path aliases.
function getPlacements(playerCount: number): number[] {
  const placements: number[] = [];

  for (let i = 0; i < Math.min(4, playerCount); i++) {
    placements.push(i + 1);
  }

  if (placements.length >= playerCount) return placements;

  let placementValue = 5;
  let groupSize = 2;
  let groupsAtCurrentSize = 0;

  while (placements.length < playerCount) {
    for (let i = 0; i < groupSize && placements.length < playerCount; i++) {
      placements.push(placementValue);
    }
    placementValue += groupSize;
    groupsAtCurrentSize++;
    if (groupsAtCurrentSize === 2) {
      groupSize *= 2;
      groupsAtCurrentSize = 0;
    }
  }

  return placements;
}

// --- Rank styles ---

function getRowBackground(rank: number, palette: PredictionPalette): string {
  if (rank === 1)
    return "linear-gradient(90deg, rgba(255, 215, 0, 0.15) 0%, transparent 75%)";
  if (rank === 2)
    return "linear-gradient(90deg, rgba(192, 192, 192, 0.15) 0%, transparent 75%)";
  if (rank === 3)
    return "linear-gradient(90deg, rgba(205, 127, 50, 0.15) 0%, transparent 75%)";
  return `linear-gradient(90deg, ${palette.accentRowBg} 0%, transparent 75%)`;
}

function getRankColor(rank: number, palette: PredictionPalette): string {
  if (rank === 1) return "#ffd700";
  if (rank === 2) return "#d0d0d0";
  if (rank === 3) return "#cd7f32";
  return palette.textMuted;
}

function getRankBgColor(rank: number): string {
  if (rank === 1) return "rgba(255, 215, 0, 0.15)";
  if (rank === 2) return "rgba(192, 192, 192, 0.12)";
  if (rank === 3) return "rgba(205, 127, 50, 0.12)";
  return "rgba(255, 255, 255, 0.06)";
}

// --- Dot pattern SVG ---

const DOT_PATTERN_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.03)"/></svg>',
)}`;

// --- JSX builder ---

function buildGraphic(
  body: RequestBody,
  tournamentIcon: string | null,
  flags: Map<string, string>,
  palette: PredictionPalette,
): React.ReactElement {
  const { tournamentName, eventName, tournamentDate, predictions, locale } =
    body;
  const subtitle = resolveSubtitle(locale);

  const formattedDate = tournamentDate
    ? DATE_FORMATTER.format(new Date(tournamentDate))
    : "";

  const meta = [eventName, formattedDate].filter(Boolean).join(" · ");
  const placements = getPlacements(predictions.length);

  const rows = predictions.map((player, index) => {
    const rank = placements[index];
    const flag = player.country
      ? flags.get(player.country.toLowerCase())
      : null;

    return h(
      "div",
      {
        key: player.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 6,
          backgroundImage: getRowBackground(rank, palette),
        },
      },
      // Rank badge
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            borderRadius: 6,
            backgroundColor: getRankBgColor(rank),
            flexShrink: 0,
          },
        },
        h(
          "span",
          {
            style: {
              fontSize: 12,
              fontWeight: 800,
              color: getRankColor(rank, palette),
            },
          },
          String(rank),
        ),
      ),
      // Country flag
      flag
        ? h("img", {
            src: flag,
            width: 15,
            height: 10,
            style: {
              borderRadius: 1,
              flexShrink: 0,
            },
          })
        : null,
      // Player name
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            flex: 1,
            fontSize: 13,
            fontWeight: 800,
            color: palette.textSecondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap" as const,
          },
        },
        player.prefix
          ? h(
              "span",
              {
                style: {
                  fontWeight: 400,
                  fontSize: 11,
                  color: palette.textMuted,
                  marginRight: 2,
                },
              },
              player.prefix,
            )
          : null,
        player.name,
      ),
    );
  });

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        width: "100%",
        height: "100%",
        backgroundImage: `linear-gradient(170deg, ${palette.bgGradientStart} 0%, ${palette.bgGradientEnd} 100%)`,
        borderRadius: 12,
        fontFamily: "M PLUS Rounded 1c",
        position: "relative" as const,
        overflow: "hidden" as const,
      },
    },
    // Dot pattern overlay
    h("div", {
      style: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: `url('${DOT_PATTERN_SVG}')`,
        backgroundSize: "16px 16px",
        backgroundRepeat: "repeat" as const,
      },
    }),
    // Header
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px 10px",
        },
      },
      tournamentIcon
        ? h("img", {
            src: tournamentIcon,
            width: 40,
            height: 40,
            style: {
              borderRadius: 8,
              flexShrink: 0,
            },
          })
        : null,
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column" as const,
            flex: 1,
            minWidth: 0,
          },
        },
        h(
          "div",
          {
            style: {
              fontSize: 15,
              fontWeight: 800,
              color: palette.textPrimary,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
            },
          },
          tournamentName,
        ),
        meta
          ? h(
              "div",
              {
                style: {
                  fontSize: 11,
                  fontWeight: 400,
                  color: palette.textMuted,
                  marginTop: 1,
                },
              },
              meta,
            )
          : null,
      ),
    ),
    // Subtitle
    h(
      "div",
      {
        style: {
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: subtitle.letterSpacing,
          color: palette.accent,
          padding: "0 16px 8px",
          borderBottom: `1px solid ${palette.borderSubtle}`,
        },
      },
      subtitle.text,
    ),
    // Prediction list
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column" as const,
          gap: 3,
          padding: "6px 10px 10px",
        },
      },
      ...rows,
    ),
    // Footer
    h(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "center",
          padding: "3px 16px",
          fontSize: 9,
          fontWeight: 400,
          color: palette.textFooter,
          borderTop: `1px solid ${palette.borderSubtle}`,
        },
      },
      "smash-ranker.app",
    ),
  );
}

// --- Height estimation ---

function estimateHeight(predictionCount: number): number {
  const header = 54;
  const subtitle = 26;
  const listPadding = 16;
  const rowHeight = 38;
  const rowGap = 3;
  const footer = 24;
  return (
    header +
    subtitle +
    listPadding +
    predictionCount * rowHeight +
    (predictionCount - 1) * rowGap +
    footer
  );
}

// --- Cache key ---

// Stable, order-independent stringification of the request body so that
// semantically equal payloads produce the same hash.
function canonicalize(body: RequestBody): string {
  return JSON.stringify({
    tournamentName: body.tournamentName ?? "",
    eventName: body.eventName ?? "",
    tournamentDate: body.tournamentDate ?? "",
    tournamentIconUrl: body.tournamentIconUrl ?? "",
    palette: body.palette ?? null,
    locale: body.locale ?? "",
    predictions: body.predictions.map((p) => ({
      id: p.id,
      name: p.name,
      prefix: p.prefix ?? "",
      country: p.country ?? "",
    })),
  });
}

function hashPayload(body: RequestBody): string {
  return createHash("sha256").update(canonicalize(body)).digest("hex");
}

// --- Payload decoding ---

function asBoundedString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new BadRequestError(`Field ${field} must be a string`);
  }
  if (value.length > MAX_FIELD_LENGTH) {
    throw new BadRequestError(`Field ${field} too long`);
  }
  return value;
}

function asOptionalBoundedString(
  value: unknown,
  field: string,
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return asBoundedString(value, field);
}

function decodePayload(encoded: unknown): RequestBody {
  const decoded = parseBase64UrlPayload(encoded, MAX_PAYLOAD_BYTES);

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new BadRequestError("Invalid payload JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new BadRequestError("Invalid payload");
  }
  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.predictions)) {
    throw new BadRequestError("predictions must be an array");
  }
  if (obj.predictions.length === 0) {
    throw new BadRequestError("predictions must not be empty");
  }
  if (obj.predictions.length > MAX_PREDICTIONS) {
    throw new BadRequestError(`predictions exceeds max of ${MAX_PREDICTIONS}`);
  }

  const predictions: PredictionPlayer[] = obj.predictions.map((p, i) => {
    if (!p || typeof p !== "object") {
      throw new BadRequestError(`predictions[${i}] must be an object`);
    }
    const item = p as Record<string, unknown>;
    const countryRaw = asOptionalBoundedString(
      item.country,
      `predictions[${i}].country`,
    );
    let country: string | undefined;
    if (countryRaw) {
      const cc = countryRaw.toLowerCase();
      if (!/^[a-z]{2}$/.test(cc)) {
        throw new BadRequestError(
          `predictions[${i}].country must be a 2-letter ISO code`,
        );
      }
      country = cc;
    }
    return {
      id: asBoundedString(item.id, `predictions[${i}].id`),
      name: asBoundedString(item.name, `predictions[${i}].name`),
      prefix: asOptionalBoundedString(item.prefix, `predictions[${i}].prefix`),
      country,
    };
  });

  // Validate the icon URL host before we'll fetch it. Empty string skips the
  // fetch entirely, which is the common case for Challonge/Tonamel sources.
  const iconUrlRaw = asOptionalBoundedString(
    obj.tournamentIconUrl,
    "tournamentIconUrl",
  );
  let tournamentIconUrl = "";
  if (iconUrlRaw) {
    // Throws BadRequestError on private IPs, http://, etc.
    parseImageUrl(iconUrlRaw);
    tournamentIconUrl = iconUrlRaw;
  }

  return {
    tournamentName:
      asOptionalBoundedString(obj.tournamentName, "tournamentName") ?? "",
    eventName: asOptionalBoundedString(obj.eventName, "eventName") ?? "",
    tournamentDate:
      asOptionalBoundedString(obj.tournamentDate, "tournamentDate") ?? "",
    tournamentIconUrl,
    predictions,
    palette: obj.palette as PredictionPalette | undefined,
    locale: asOptionalBoundedString(obj.locale, "locale"),
  };
}

// --- Handler ---

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body: RequestBody;
  try {
    body = decodePayload(req.query.d);
  } catch (err) {
    if (respondClientError(res, err)) return;
    throw err;
  }

  const hash = hashPayload(body);
  const etag = `"${hash}"`;

  res.setHeader("Content-Type", "image/png");
  // The URL is content-addressed by the base64url payload, so the same `?d=`
  // value always produces the exact same PNG — `immutable` is honest. Header
  // priority: Vercel-CDN > CDN > Cache-Control. The Vercel-only header is
  // stripped before reaching the browser.
  res.setHeader(
    "Vercel-CDN-Cache-Control",
    "public, max-age=31536000, immutable",
  );
  res.setHeader("CDN-Cache-Control", "public, max-age=86400");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("ETag", etag);

  if (req.headers["if-none-match"] === etag) {
    res.setHeader("X-Cache", "HIT-ETAG");
    return res.status(304).end();
  }

  const cachedPng = lruGet(pngCache, hash);
  if (cachedPng) {
    res.setHeader("X-Cache", "HIT");
    return res.status(200).send(cachedPng);
  }

  addBreadcrumb("prediction-image", "fetch_assets_start");
  const [tournamentIcon, flags] = await Promise.all([
    fetchTournamentIcon(body.tournamentIconUrl),
    preloadFlags(body.predictions.map((p) => p.country)),
  ]);
  addBreadcrumb("prediction-image", "fetch_assets_done", {
    hasIcon: tournamentIcon != null,
    flagCount: flags.size,
  });

  const palette: PredictionPalette = {
    ...DEFAULT_PALETTE,
    ...(body.palette ?? {}),
  };

  const height = estimateHeight(body.predictions.length);
  const graphic = buildGraphic(body, tournamentIcon, flags, palette);

  addBreadcrumb("prediction-image", "satori_start", {
    predictionCount: body.predictions.length,
  });
  const svg = await satori(graphic, {
    width: WIDTH,
    height,
    fonts: [
      { name: "M PLUS Rounded 1c", data: fontRegular, weight: 400 },
      { name: "M PLUS Rounded 1c", data: fontBold, weight: 800 },
    ],
  });
  addBreadcrumb("prediction-image", "satori_done");

  // PNG output is deterministic on Vercel's Linux x64 runtime in production.
  // Local dev uses platform-specific Resvg binaries (darwin-arm64, win32-x64,
  // etc.) which may produce subpixel differences from the production binary.
  addBreadcrumb("prediction-image", "resvg_start");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width" as const, value: OUTPUT_WIDTH },
    font: { loadSystemFonts: false },
  });
  const png = Buffer.from(resvg.render().asPng());
  addBreadcrumb("prediction-image", "resvg_done", { bytes: png.length });

  lruSet(pngCache, hash, png, PNG_CACHE_MAX);
  res.setHeader("X-Cache", "MISS");
  return res.status(200).send(png);
};

export default withLogging("prediction-image", handler);
