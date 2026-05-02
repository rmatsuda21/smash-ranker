import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import React from "react";

// Cached at module scope for warm starts
const fontRegular = readFileSync(
  join(__dirname, "fonts/MPLUSRounded1c-Regular.ttf")
);
const fontBold = readFileSync(
  join(__dirname, "fonts/MPLUSRounded1c-ExtraBold.ttf")
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
};

// --- Image fetching ---

const FETCH_TIMEOUT_MS = 1500;

async function fetchImageAsDataUrl(
  url: string,
  retries = 1
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
  console.warn(`[prediction-image] fetch failed after ${retries + 1} attempts: ${url}`);
  return null;
}

async function fetchTournamentIcon(
  tournamentIconUrl: string
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
      TOURNAMENT_ICON_CACHE_MAX
    );
  }
  return fetched;
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
  '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.03)"/></svg>'
)}`;

// --- JSX builder ---

function buildGraphic(
  body: RequestBody,
  tournamentIcon: string | null,
  palette: PredictionPalette
): React.ReactElement {
  const { tournamentName, eventName, tournamentDate, predictions } = body;

  const formattedDate = tournamentDate
    ? DATE_FORMATTER.format(new Date(tournamentDate))
    : "";

  const meta = [eventName, formattedDate].filter(Boolean).join(" · ");

  const rows = predictions.map((player, index) => {
    const rank = index + 1;

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
          String(rank)
        )
      ),
      // Player name
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "baseline",
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
                  marginRight: 4,
                },
              },
              player.prefix
            )
          : null,
        player.name
      )
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
          tournamentName
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
              meta
            )
          : null
      )
    ),
    // Subtitle
    h(
      "div",
      {
        style: {
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 2,
          color: palette.accent,
          padding: "0 16px 8px",
          borderBottom: `1px solid ${palette.borderSubtle}`,
        },
      },
      "PREDICTIONS"
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
      ...rows
    ),
    // Footer
    h(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "center",
          padding: "8px 16px",
          fontSize: 9,
          fontWeight: 400,
          color: palette.textFooter,
          borderTop: `1px solid ${palette.borderSubtle}`,
        },
      },
      "smash-ranker.app"
    )
  );
}

// --- Height estimation ---

function estimateHeight(predictionCount: number): number {
  const header = 54;
  const subtitle = 26;
  const listPadding = 16;
  const rowHeight = 38;
  const rowGap = 3;
  const footer = 34;
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
    predictions: body.predictions.map((p) => ({
      id: p.id,
      name: p.name,
      prefix: p.prefix ?? "",
    })),
  });
}

function hashPayload(body: RequestBody): string {
  return createHash("sha256").update(canonicalize(body)).digest("hex");
}

// --- Payload decoding ---

function decodePayload(encoded: string): RequestBody | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.predictions)) return null;
    return parsed as RequestBody;
  } catch {
    return null;
  }
}

// --- Handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const encoded = req.query.d;
    if (typeof encoded !== "string" || encoded.length === 0) {
      return res.status(400).json({ error: "Missing 'd' query parameter" });
    }

    const body = decodePayload(encoded);
    if (!body) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const hash = hashPayload(body);
    const etag = `"${hash}"`;

    res.setHeader("Content-Type", "image/png");
    // GET URLs are content-addressed (different `d` → different URL), so the
    // CDN can safely cache for a long time. The browser revalidates after
    // max-age via ETag.
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800"
    );
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

    const tournamentIcon = await fetchTournamentIcon(body.tournamentIconUrl);

    const palette: PredictionPalette = {
      ...DEFAULT_PALETTE,
      ...(body.palette ?? {}),
    };

    const height = estimateHeight(body.predictions.length);
    const graphic = buildGraphic(body, tournamentIcon, palette);

    const svg = await satori(graphic, {
      width: WIDTH,
      height,
      fonts: [
        { name: "M PLUS Rounded 1c", data: fontRegular, weight: 400 },
        { name: "M PLUS Rounded 1c", data: fontBold, weight: 800 },
      ],
    });

    // PNG output is deterministic on Vercel's Linux x64 runtime in production.
    // Local dev uses platform-specific Resvg binaries (darwin-arm64, win32-x64,
    // etc.) which may produce subpixel differences from the production binary.
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width" as const, value: OUTPUT_WIDTH },
      font: { loadSystemFonts: false },
    });
    const png = Buffer.from(resvg.render().asPng());

    lruSet(pngCache, hash, png, PNG_CACHE_MAX);
    res.setHeader("X-Cache", "MISS");
    return res.status(200).send(png);
  } catch (error) {
    console.error("Prediction image error:", error);
    return res.status(500).json({ error: "Failed to generate image" });
  }
}
