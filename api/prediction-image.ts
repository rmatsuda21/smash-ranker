import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "fs";
import { join } from "path";
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

const WIDTH = 380;
const OUTPUT_WIDTH = 760; // 2x pixel ratio for rasterization

const STOCK_BASE =
  "https://raw.githubusercontent.com/rmatsuda21/SmashRankerAssets/main/stock";

const h = React.createElement;

type PredictionPlayer = {
  id: string;
  name: string;
  prefix?: string;
  characterId: string;
};

type RequestBody = {
  tournamentName: string;
  eventName: string;
  tournamentDate: string;
  tournamentIconUrl: string;
  predictions: PredictionPlayer[];
};

// --- Image fetching ---

async function fetchImageAsDataUrl(
  url: string,
  retries = 1
): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
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
  return null;
}

async function fetchAllImages(
  predictions: PredictionPlayer[],
  tournamentIconUrl: string
) {
  const charIds = predictions
    .map((p) => p.characterId)
    .filter((id) => id !== "");

  const charUrls = charIds.map((id) => `${STOCK_BASE}/${id}/0.png`);

  const [tournamentIcon, ...charResults] = await Promise.all([
    tournamentIconUrl ? fetchImageAsDataUrl(tournamentIconUrl) : null,
    ...charUrls.map(fetchImageAsDataUrl),
  ]);

  const charMap = new Map<string, string>();
  charIds.forEach((id, i) => {
    if (charResults[i]) charMap.set(id, charResults[i]!);
  });

  return { tournamentIcon, charMap };
}

// --- Rank styles ---

function getRowBackground(rank: number): string {
  if (rank === 1)
    return "linear-gradient(90deg, rgba(255, 215, 0, 0.15) 0%, transparent 75%)";
  if (rank === 2)
    return "linear-gradient(90deg, rgba(192, 192, 192, 0.15) 0%, transparent 75%)";
  if (rank === 3)
    return "linear-gradient(90deg, rgba(205, 127, 50, 0.15) 0%, transparent 75%)";
  return "linear-gradient(90deg, rgba(124, 92, 191, 0.28) 0%, transparent 75%)";
}

function getRankColor(rank: number): string {
  if (rank === 1) return "#ffd700";
  if (rank === 2) return "#d0d0d0";
  if (rank === 3) return "#cd7f32";
  return "#8888aa";
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
  charMap: Map<string, string>
): React.ReactElement {
  const { tournamentName, eventName, tournamentDate, predictions } = body;

  const formattedDate = tournamentDate
    ? new Date(tournamentDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : "";

  const meta = [eventName, formattedDate].filter(Boolean).join(" · ");

  const rows = predictions.map((player, index) => {
    const rank = index + 1;
    const charDataUrl = player.characterId
      ? charMap.get(player.characterId)
      : null;

    return h(
      "div",
      {
        key: player.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 3,
          padding: "6px 10px",
          borderRadius: 6,
          backgroundImage: getRowBackground(rank),
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
              color: getRankColor(rank),
            },
          },
          String(rank)
        )
      ),
      // Character icon or placeholder
      charDataUrl
        ? h("img", {
            src: charDataUrl,
            width: 20,
            height: 20,
            style: { flexShrink: 0 },
          })
        : h("div", { style: { width: 20, height: 20, flexShrink: 0 } }),
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
            color: "#e8e8f0",
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
                  color: "#8888aa",
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
        backgroundImage: "linear-gradient(170deg, #1e1e3a 0%, #14142a 100%)",
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
              color: "#ffffff",
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
                  color: "#6c6c8a",
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
          color: "#7c5cbf",
          padding: "0 16px 8px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
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
          color: "#4a4a60",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
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

// --- Handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body as RequestBody;

    if (!body.predictions || !Array.isArray(body.predictions)) {
      return res.status(400).json({ error: "Missing predictions array" });
    }

    const { tournamentIcon, charMap } = await fetchAllImages(
      body.predictions,
      body.tournamentIconUrl
    );

    const height = estimateHeight(body.predictions.length);
    const graphic = buildGraphic(body, tournamentIcon, charMap);

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
    const png = resvg.render().asPng();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    return res.status(200).send(Buffer.from(png));
  } catch (error) {
    console.error("Prediction image error:", error);
    return res.status(500).json({ error: "Failed to generate image" });
  }
}
