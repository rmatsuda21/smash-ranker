import "./_instrument";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import React from "react";

import { addBreadcrumb, withLogging } from "./_lib/withLogging";
import {
  decodeInvite,
  fetchTournamentMeta,
  type TournamentMeta,
} from "./_lib/tournamentMeta";

const fontRegular = readFileSync(
  join(__dirname, "fonts/MPLUSRounded1c-Regular.ttf"),
);
const fontBold = readFileSync(
  join(__dirname, "fonts/MPLUSRounded1c-ExtraBold.ttf"),
);

const WIDTH = 600;
const HEIGHT = 315;
const OUTPUT_WIDTH = 1200; // 2x pixel ratio → 1200×630, OG standard

const h = React.createElement;

const FETCH_TIMEOUT_MS = 1500;

const ICON_CACHE_MAX = 64;
const PNG_CACHE_MAX = 64;
const iconCache = new Map<string, string>();
const pngCache = new Map<string, Buffer>();

const lruGet = <V>(cache: Map<string, V>, key: string): V | undefined => {
  const value = cache.get(key);
  if (value !== undefined) {
    cache.delete(key);
    cache.set(key, value);
  }
  return value;
};

const lruSet = <V>(
  cache: Map<string, V>,
  key: string,
  value: V,
  max: number,
) => {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  if (cache.size > max) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
};

const fetchImageAsDataUrl = async (url: string): Promise<string | null> => {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/png";
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
};

const fetchIcon = async (iconUrl: string | null): Promise<string | null> => {
  if (!iconUrl) return null;
  const cached = lruGet(iconCache, iconUrl);
  if (cached) return cached;
  const fetched = await fetchImageAsDataUrl(iconUrl);
  if (fetched) lruSet(iconCache, iconUrl, fetched, ICON_CACHE_MAX);
  return fetched;
};

const PALETTE = {
  bgGradientStart: "#1e1e3a",
  bgGradientEnd: "#0e0e1a",
  accent: "#7c5cbf",
  accentSoft: "rgba(124, 92, 191, 0.18)",
  textPrimary: "#ffffff",
  textSecondary: "#cfcfe0",
  textMuted: "#7a7a92",
  borderSubtle: "rgba(255, 255, 255, 0.08)",
};

const DOT_PATTERN_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.04)"/></svg>',
)}`;

const truncate = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

type CardData = {
  title: string;
  iconDataUrl: string | null;
};

const buildGraphic = (data: CardData): React.ReactElement => {
  const title = truncate(data.title || "Tournament", 60);

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        width: "100%",
        height: "100%",
        backgroundImage: `linear-gradient(135deg, ${PALETTE.bgGradientStart} 0%, ${PALETTE.bgGradientEnd} 100%)`,
        fontFamily: "M PLUS Rounded 1c",
        position: "relative" as const,
        overflow: "hidden" as const,
      },
    },
    // Dot overlay
    h("div", {
      style: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: `url('${DOT_PATTERN_SVG}')`,
        backgroundSize: "20px 20px",
        backgroundRepeat: "repeat" as const,
      },
    }),
    // Accent glow blob
    h("div", {
      style: {
        position: "absolute" as const,
        top: -120,
        right: -120,
        width: 360,
        height: 360,
        borderRadius: 360,
        backgroundColor: PALETTE.accentSoft,
        filter: "blur(40px)",
      },
    }),
    // Body row
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "row" as const,
          alignItems: "center",
          gap: 28,
          padding: "44px 48px 0",
          flex: 1,
        },
      },
      data.iconDataUrl
        ? h("img", {
            src: data.iconDataUrl,
            width: 140,
            height: 140,
            style: {
              borderRadius: 18,
              flexShrink: 0,
              border: `1px solid ${PALETTE.borderSubtle}`,
            },
          })
        : h(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 140,
                height: 140,
                borderRadius: 18,
                backgroundColor: PALETTE.accentSoft,
                border: `1px solid ${PALETTE.borderSubtle}`,
                flexShrink: 0,
                fontSize: 64,
                fontWeight: 800,
                color: PALETTE.accent,
              },
            },
            "SR",
          ),
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
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 3,
              color: PALETTE.accent,
              textTransform: "uppercase" as const,
              marginBottom: 10,
            },
          },
          "Top 8 Predictions",
        ),
        h(
          "div",
          {
            style: {
              fontSize: 42,
              fontWeight: 800,
              color: PALETTE.textPrimary,
              lineHeight: 1.15,
              letterSpacing: -0.5,
            },
          },
          title,
        ),
        h(
          "div",
          {
            style: {
              fontSize: 18,
              fontWeight: 400,
              color: PALETTE.textSecondary,
              marginTop: 14,
            },
          },
          "Make your top-8 prediction and share it.",
        ),
      ),
    ),
    // Footer
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 48px",
          marginTop: 24,
          borderTop: `1px solid ${PALETTE.borderSubtle}`,
        },
      },
      h(
        "div",
        {
          style: {
            fontSize: 18,
            fontWeight: 800,
            color: PALETTE.textPrimary,
            letterSpacing: 0.4,
          },
        },
        "smash-ranker.app",
      ),
      h(
        "div",
        {
          style: {
            fontSize: 14,
            fontWeight: 400,
            color: PALETTE.textMuted,
          },
        },
        "Tournament graphics for Super Smash Bros.",
      ),
    ),
  );
};

const renderPng = async (data: CardData): Promise<Buffer> => {
  addBreadcrumb("og-image", "satori_start");
  const svg = await satori(buildGraphic(data), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "M PLUS Rounded 1c", data: fontRegular, weight: 400 },
      { name: "M PLUS Rounded 1c", data: fontBold, weight: 800 },
    ],
  });
  addBreadcrumb("og-image", "satori_done");

  addBreadcrumb("og-image", "resvg_start");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width" as const, value: OUTPUT_WIDTH },
    font: { loadSystemFonts: false },
  });
  const png = Buffer.from(resvg.render().asPng());
  addBreadcrumb("og-image", "resvg_done", { bytes: png.length });

  return png;
};

const cacheKey = (meta: TournamentMeta): string => {
  return createHash("sha256")
    .update(`${meta.name} ${meta.iconUrl ?? ""}`)
    .digest("hex");
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const encoded = req.query.d;
  if (typeof encoded !== "string" || encoded.length === 0) {
    return res.status(400).json({ error: "Missing 'd' query parameter" });
  }

  const invite = decodeInvite(encoded);
  if (!invite) {
    return res.status(400).json({ error: "Invalid invite" });
  }

  res.setHeader("Content-Type", "image/png");
  // Aggressive CDN caching — share previews are crawler-driven and tournament
  // names rarely change. ETag handles the "tournament icon updated" case.
  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, s-maxage=604800, stale-while-revalidate=2592000",
  );

  const meta = await fetchTournamentMeta(invite.platform, invite.slug);
  if (!meta || !meta.name) {
    // Fall back to the static default rather than 404ing — the OG card URL is
    // referenced from share unfurls, and a broken image looks worse than a
    // generic one.
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
    return res.redirect(302, "/og-default.png");
  }

  const hash = cacheKey(meta);
  const etag = `"${hash}"`;
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

  addBreadcrumb("og-image", "fetch_icon_start");
  const iconDataUrl = await fetchIcon(meta.iconUrl);
  addBreadcrumb("og-image", "fetch_icon_done", {
    hasIcon: iconDataUrl != null,
  });

  const png = await renderPng({ title: meta.name, iconDataUrl });

  lruSet(pngCache, hash, png, PNG_CACHE_MAX);
  res.setHeader("X-Cache", "MISS");
  return res.status(200).send(png);
};

export default withLogging("og-image", handler);
