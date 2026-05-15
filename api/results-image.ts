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

const MAX_PAYLOAD_BYTES = 32 * 1024;
const MAX_SETS = 32;
const MAX_FIELD_LENGTH = 256;
const MAX_CHARACTERS_PER_SIDE = 4;

const fontRegular = readFileSync(
  join(__dirname, "fonts/MPLUSRounded1c-Regular.ttf"),
);
const fontBold = readFileSync(
  join(__dirname, "fonts/MPLUSRounded1c-ExtraBold.ttf"),
);

const WIDTH = 480;
const OUTPUT_WIDTH = 960;

const h = React.createElement;

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const TOURNAMENT_ICON_CACHE_MAX = 64;
const tournamentIconCache = new Map<string, string>();

const CHARACTER_ICON_CACHE_MAX = 256;
const characterIconCache = new Map<string, string>();

const FLAG_CACHE_MAX = 280;
const flagCache = new Map<string, string>();

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

type SetOpponent = {
  name: string;
  prefix?: string;
  country?: string;
  topRanking?: PlayerRanking;
  seed: number;
  placement: number;
  characters: string[];
  fallbackCharacterId?: string | null;
};

type ResultSet = {
  id: string;
  fullRoundText: string;
  scoreSelf: number;
  scoreOpponent: number;
  didWin: boolean;
  isDQ: boolean;
  upsetFactor?: number;
  phaseId: string;
  phaseName: string;
  selfCharacters: string[];
  opponent: SetOpponent;
};

type PlayerRanking = { title: string; rank: number; displayTitle?: string };

type PlayerInfo = {
  name: string;
  prefix?: string;
  country?: string;
  iconUrl?: string;
  rankings: PlayerRanking[];
  seed: number;
  placement: number;
  wins: number;
  losses: number;
};

type RequestBody = {
  tournamentName: string;
  eventName: string;
  tournamentDate: string;
  tournamentIconUrl: string;
  tournamentCountry?: string | null;
  numEntrants: number;
  palette?: PredictionPalette;
  locale?: string;
  player: PlayerInfo;
  fallbackCharacterId?: string | null;
  sets: ResultSet[];
};

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
    `[results-image] fetch failed after ${retries + 1} attempts: ${url}`,
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

const CHARACTER_ASSET_BASE =
  "https://raw.githubusercontent.com/rmatsuda21/SmashRankerAssets/main/stock";

// satori v0.26 throws "Spread syntax requires ...iterable" when handed a WebP
// — its internal image decoder hits an unguarded null path. The asset repo
// only ships WebP, so we decode + re-encode to PNG before satori sees it.
async function fetchCharacterIcon(characterId: string): Promise<string | null> {
  const cached = lruGet(characterIconCache, characterId);
  if (cached) return cached;
  const url = `${CHARACTER_ASSET_BASE}/${characterId}/0.webp`;

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) continue;

      const webpBuf = Buffer.from(await res.arrayBuffer());
      const pngBuf = await sharp(webpBuf).png().toBuffer();
      const dataUrl = `data:image/png;base64,${pngBuf.toString("base64")}`;
      lruSet(
        characterIconCache,
        characterId,
        dataUrl,
        CHARACTER_ICON_CACHE_MAX,
      );
      return dataUrl;
    } catch {
      // retry
    }
  }
  console.warn(`[results-image] character fetch failed: ${characterId}`);
  return null;
}

// Flag SVGs are bundled via vercel.json `includeFiles: public/assets/flags/**`.
// We resolve from process.cwd() (project root in both Vercel and the Vite dev
// proxy). Decode SVG → PNG via sharp; satori handles PNG reliably.
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

async function preloadCharacterIcons(
  sets: ResultSet[],
  extraIds: (string | null | undefined)[] = [],
): Promise<Map<string, string>> {
  const ids = new Set<string>();
  for (const set of sets) {
    for (const id of set.selfCharacters) ids.add(id);
    for (const id of set.opponent.characters) ids.add(id);
  }
  for (const id of extraIds) {
    if (id) ids.add(id);
  }
  const map = new Map<string, string>();
  await Promise.all(
    Array.from(ids).map(async (id) => {
      const icon = await fetchCharacterIcon(id);
      if (icon) map.set(id, icon);
    }),
  );
  return map;
}

// --- Helpers ---

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// Bottom stats row: "{W}-{L} record · seed {N} {+Δ}". The seed delta is inline
// text (not a pill), color-coded: accent for positive, warm red for negative,
// muted for even/missing.
function buildRecordSeedRow(
  player: PlayerInfo,
  palette: PredictionPalette,
): React.ReactElement {
  const sep = () =>
    h(
      "span",
      {
        style: {
          display: "flex",
          color: palette.textMuted,
          opacity: 0.5,
          margin: "0 6px",
        },
      },
      "·",
    );

  let deltaEl: React.ReactElement | null = null;
  const delta = computeSeedDeltaServer(player.seed, player.placement);
  if (delta != null) {
    if (delta > 0) {
      deltaEl = h(
        "span",
        {
          style: {
            display: "flex",
            marginLeft: 5,
            fontWeight: 800,
            color: palette.accent,
          },
        },
        `(+${delta})`,
      );
    } else if (delta < 0) {
      deltaEl = h(
        "span",
        {
          style: {
            display: "flex",
            marginLeft: 5,
            fontWeight: 800,
            color: "#FF8A99",
          },
        },
        `(${delta})`,
      );
    } else {
      deltaEl = h(
        "span",
        {
          style: {
            display: "flex",
            marginLeft: 5,
            // Match the +/-N weight so the "matched seed" state reads clearly
            // — `=` is the visual cue, not the dimming.
            fontWeight: 800,
            color: palette.textSecondary,
          },
        },
        "(=)",
      );
    }
  }

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "row" as const,
        alignItems: "baseline",
        fontSize: 12,
        color: palette.textMuted,
      },
    },
    h(
      "span",
      {
        style: {
          display: "flex",
          color: palette.textPrimary,
          fontWeight: 700,
        },
      },
      `${player.wins}-${player.losses}`,
    ),
    player.seed > 0 ? sep() : null,
    player.seed > 0
      ? h(
          "span",
          { style: { display: "flex" } },
          h("span", { style: { color: palette.textMuted } }, "seed "),
          h(
            "span",
            {
              style: {
                color: palette.textPrimary,
                fontWeight: 700,
                marginLeft: 2,
              },
            },
            String(player.seed),
          ),
          deltaEl,
        )
      : null,
  );
}

// Stylistic tier for the UF badge. Mirrors `upsetTier` in
// src/utils/results/upsetFactor.ts; satori can't run that file directly so we
// inline the tiny mapping here.
type UpsetTier = "minor" | "notable" | "major" | "legendary";
function upsetTier(uf: number): UpsetTier {
  if (uf >= 9) return "legendary";
  if (uf >= 6) return "major";
  if (uf >= 3) return "notable";
  return "minor";
}

// Placement-tier lookup, lifted from upsets.gg. Mirrors `SEED_TIERS` in
// src/utils/results/upsetFactor.ts. Used for the tier-based seed delta in
// the player summary band (how many bracket tiers up/down did they go vs
// their seed projection).
const SEED_TIERS_SERVER: ReadonlyArray<readonly [number, number, number]> = [
  [1, 1, 0],
  [2, 2, 1],
  [3, 3, 2],
  [4, 4, 3],
  [5, 6, 4],
  [7, 8, 5],
  [9, 12, 6],
  [13, 16, 7],
  [17, 24, 8],
  [25, 32, 9],
  [33, 48, 10],
  [49, 64, 11],
  [65, 96, 12],
  [97, 128, 13],
  [129, 192, 14],
  [193, 256, 15],
  [257, 384, 16],
  [385, 512, 17],
  [513, 768, 18],
  [769, 1024, 19],
  [1025, 1536, 20],
  [1537, 2048, 21],
  [2049, 3072, 22],
  [3073, 4096, 23],
];

function seedTierServer(seed: number): number | null {
  if (!Number.isFinite(seed) || seed <= 0) return null;
  const s = Math.floor(seed);
  for (const [lo, hi, t] of SEED_TIERS_SERVER) {
    if (s >= lo && s <= hi) return t;
  }
  return SEED_TIERS_SERVER[SEED_TIERS_SERVER.length - 1][2];
}

// Signed delta in tier space: positive when the player placed higher than
// their seed projected, negative when they underperformed.
function computeSeedDeltaServer(
  seed: number,
  placement: number,
): number | null {
  const s = seedTierServer(seed);
  const p = seedTierServer(placement);
  if (s == null || p == null) return null;
  return s - p;
}

// satori-compatible inline style per tier. Bigger upset = more dramatic, but
// the box geometry (padding / font size / radius) is identical to the W/L
// chip so the badges sit at the same height. Tier differences live only in
// color, background, border, and shadow.
function upsetBadgeStyle(
  uf: number,
  palette: PredictionPalette,
): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 7,
    paddingRight: 7,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.4,
    lineHeight: 1,
  };
  switch (upsetTier(uf)) {
    case "minor":
      return {
        ...base,
        color: palette.textMuted,
        backgroundColor: "rgba(255,255,255,0.06)",
      };
    case "notable":
      return {
        ...base,
        color: palette.accent,
        backgroundColor: palette.accentRowBg,
      };
    case "major":
      return {
        ...base,
        color: "#FFD86B",
        backgroundColor: "rgba(255, 200, 50, 0.16)",
        border: "1px solid rgba(255, 200, 50, 0.4)",
      };
    case "legendary":
      return {
        ...base,
        color: "#FFE680",
        backgroundImage:
          "linear-gradient(135deg, rgba(255,180,50,0.36) 0%, rgba(255,80,150,0.30) 100%)",
        border: "1px solid rgba(255, 220, 100, 0.6)",
        boxShadow: "0 0 10px rgba(255, 200, 50, 0.55)",
      };
  }
}

// --- Dot pattern SVG ---

const DOT_PATTERN_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.03)"/></svg>',
)}`;

// --- JSX builder ---

const CHAR_SIZE = 24;

// Visually-intentional empty slot when there's no set-level character data
// AND no recent-fallback character was found. Dashed-border square; the
// dashed treatment alone reads as "placeholder / missing" without needing a
// glyph inside.
function buildEmptyCharacterSlot(): React.ReactElement {
  return h("div", {
    style: {
      width: CHAR_SIZE,
      height: CHAR_SIZE,
      borderRadius: 3,
      flexShrink: 0,
      backgroundColor: "rgba(255,255,255,0.03)",
      border: "1px dashed rgba(255,255,255,0.18)",
    },
  });
}

function buildCharacterStack(
  characters: string[],
  iconMap: Map<string, string>,
  fallbackId?: string | null,
): React.ReactElement {
  const slots = characters.slice(0, 3);
  // No set-level data: render the grayscale fallback if we have one, else the
  // dashed "?" empty-state pill.
  if (slots.length === 0) {
    if (fallbackId) {
      const src = iconMap.get(fallbackId);
      if (src) {
        return h("img", {
          src,
          width: CHAR_SIZE,
          height: CHAR_SIZE,
          style: {
            borderRadius: 3,
            flexShrink: 0,
            filter: "grayscale(1)",
            opacity: 0.35,
          },
        });
      }
    }
    return buildEmptyCharacterSlot();
  }
  return h(
    "div",
    {
      style: {
        display: "flex",
        gap: 3,
        flexDirection: "row" as const,
        flexShrink: 0,
      },
    },
    ...slots.map((id) => {
      const src = iconMap.get(id);
      if (src) {
        return h("img", {
          key: id,
          src,
          width: CHAR_SIZE,
          height: CHAR_SIZE,
          style: { borderRadius: 3, flexShrink: 0 },
        });
      }
      // We know they used a character (we have an id) but the icon failed to
      // fetch. Use a solid grey tile rather than the dashed "?" — this is a
      // missing-asset case, not a missing-data case.
      return h("div", {
        key: id,
        style: {
          width: CHAR_SIZE,
          height: CHAR_SIZE,
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.08)",
          flexShrink: 0,
        },
      });
    }),
  );
}

type PhaseGroup = { id: string; name: string; sets: ResultSet[] };

// Linear pass — sets are already sorted by (phaseOrder, startAt) upstream.
function groupSetsByPhase(sets: ResultSet[]): PhaseGroup[] {
  const groups: PhaseGroup[] = [];
  for (const s of sets) {
    const last = groups[groups.length - 1];
    if (last && last.id === s.phaseId) {
      last.sets.push(s);
    } else {
      groups.push({ id: s.phaseId, name: s.phaseName, sets: [s] });
    }
  }
  return groups;
}

function buildPhaseSection(
  group: PhaseGroup,
  palette: PredictionPalette,
  iconMap: Map<string, string>,
  flagMap: Map<string, string>,
  fallbackCharacterId?: string | null,
): React.ReactElement {
  return h(
    "div",
    {
      key: group.id,
      style: {
        display: "flex",
        flexDirection: "column" as const,
        gap: 4,
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 1.2,
          color: palette.accent,
          textTransform: "uppercase" as const,
          paddingBottom: 3,
          marginBottom: 2,
          borderBottom: `1px solid ${palette.borderSubtle}`,
        },
      },
      group.name,
    ),
    ...group.sets.map((s) =>
      buildSetRow(s, palette, iconMap, flagMap, fallbackCharacterId),
    ),
  );
}

function buildSetRow(
  set: ResultSet,
  palette: PredictionPalette,
  iconMap: Map<string, string>,
  flagMap: Map<string, string>,
  fallbackCharacterId?: string | null,
): React.ReactElement {
  const borderColor = set.didWin ? palette.accent : palette.textMuted;
  const scoreColor = set.didWin ? palette.accent : palette.textSecondary;
  const meta =
    set.opponent.seed && set.opponent.placement
      ? `(#${set.opponent.seed} → ${set.opponent.placement}${ordinal(set.opponent.placement)})`
      : set.opponent.seed
        ? `(#${set.opponent.seed})`
        : "";
  const opponentFlag =
    set.opponent.country && flagMap.get(set.opponent.country.toLowerCase());

  return h(
    "div",
    {
      key: set.id,
      style: {
        display: "flex",
        flexDirection: "column" as const,
        gap: 1,
        padding: "5px 12px 6px",
        borderRadius: 6,
        backgroundColor: set.didWin
          ? "rgba(255,255,255,0.045)"
          : "rgba(255,255,255,0.025)",
        borderLeft: `3px solid ${borderColor}`,
        opacity: set.isDQ ? 0.65 : 1,
      },
    },
    // Row 1: round label, centered.
    h(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "center",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1,
          color: palette.textMuted,
        },
      },
      (set.fullRoundText || "—").toUpperCase(),
    ),
    // Row 2: chars · score · chars. Equal `flex: 1 1 0` on each side keeps
    // the score pinned to the midpoint regardless of how many chars per side.
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "row" as const,
          alignItems: "center",
          gap: 10,
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            flex: "1 1 0" as unknown as number,
            minWidth: 0,
            justifyContent: "flex-end",
            alignItems: "center",
          },
        },
        buildCharacterStack(set.selfCharacters, iconMap, fallbackCharacterId),
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            // Fixed footprint so "DQ" (narrow) and "X - Y" (wider) occupy the
            // same horizontal space and the character icons on either side
            // stay aligned across rows. Sized to comfortably fit common
            // single-digit scores like "2 - 1"; wider scores will grow beyond
            // this min, which is acceptable.
            minWidth: 48,
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: 0.4,
            color: set.isDQ ? palette.textMuted : scoreColor,
          },
        },
        set.isDQ ? "DQ" : `${set.scoreSelf} - ${set.scoreOpponent}`,
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            flex: "1 1 0" as unknown as number,
            minWidth: 0,
            justifyContent: "flex-start",
            alignItems: "center",
          },
        },
        buildCharacterStack(
          set.opponent.characters,
          iconMap,
          set.opponent.fallbackCharacterId,
        ),
      ),
    ),
    // Row 3: inline opponent info (left, ellipsizes) + optional UF (right).
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "row" as const,
          alignItems: "center",
          gap: 6,
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "row" as const,
            alignItems: "center",
            flex: 1,
            minWidth: 0,
            gap: 5,
            overflow: "hidden",
          },
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              fontSize: 9,
              fontWeight: 400,
              color: palette.textMuted,
              flexShrink: 0,
            },
          },
          "vs",
        ),
        opponentFlag
          ? h("img", {
              src: opponentFlag,
              width: 13,
              height: 9,
              style: { borderRadius: 1, flexShrink: 0 },
            })
          : null,
        h(
          "div",
          {
            style: {
              display: "flex",
              minWidth: 0,
              fontSize: 11,
              fontWeight: 700,
              color: palette.textSecondary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
            },
          },
          set.opponent.prefix
            ? h(
                "span",
                {
                  style: {
                    fontWeight: 400,
                    color: palette.textMuted,
                    marginRight: 3,
                  },
                },
                `${set.opponent.prefix} |`,
              )
            : null,
          set.opponent.name,
        ),
        meta
          ? h(
              "div",
              {
                style: {
                  display: "flex",
                  fontSize: 9,
                  fontWeight: 400,
                  color: palette.textMuted,
                  flexShrink: 0,
                },
              },
              meta,
            )
          : null,
        set.opponent.topRanking
          ? h(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  paddingTop: 1,
                  paddingBottom: 1,
                  paddingLeft: 5,
                  paddingRight: 5,
                  borderRadius: 999,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  lineHeight: 1,
                  color: palette.accent,
                  backgroundColor: palette.accentRowBg,
                  flexShrink: 0,
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap" as const,
                },
              },
              `${set.opponent.topRanking.displayTitle ?? set.opponent.topRanking.title} #${set.opponent.topRanking.rank}`,
            )
          : null,
      ),
      set.upsetFactor !== undefined && set.upsetFactor > 0
        ? h(
            "div",
            { style: upsetBadgeStyle(set.upsetFactor, palette) },
            `UF ${set.upsetFactor}`,
          )
        : null,
    ),
  );
}

function buildGraphic(
  body: RequestBody,
  tournamentIcon: string | null,
  playerIcon: string | null,
  iconMap: Map<string, string>,
  flagMap: Map<string, string>,
  palette: PredictionPalette,
): React.ReactElement {
  const {
    tournamentName,
    eventName,
    tournamentDate,
    player,
    sets,
    fallbackCharacterId,
  } = body;

  const formattedDate = tournamentDate
    ? DATE_FORMATTER.format(new Date(tournamentDate))
    : "";

  const meta = [eventName, formattedDate].filter(Boolean).join(" · ");

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        width: "100%",
        backgroundImage: `linear-gradient(170deg, ${palette.bgGradientStart} 0%, ${palette.bgGradientEnd} 100%)`,
        borderRadius: 12,
        fontFamily: "M PLUS Rounded 1c",
        position: "relative" as const,
        overflow: "hidden" as const,
      },
    },
    // Dot pattern as a tiled background on the root (avoids needing an
    // absolutely-positioned overlay that would depend on a fixed parent height).
    h("div", {
      style: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('${DOT_PATTERN_SVG}')`,
        backgroundSize: "16px 16px",
        backgroundRepeat: "repeat" as const,
      },
    }),
    // Tournament header — icon + (name, meta-line with country flag inline).
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "row" as const,
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
            style: { borderRadius: 8, flexShrink: 0 },
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
        // Meta line: [country flag] · event · date. Flag rendered as a
        // standalone <img> sibling so it lines up with the text baseline at the
        // same height as the metadata font.
        eventName || formattedDate || body.tournamentCountry
          ? h(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "row" as const,
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2,
                  fontSize: 11,
                  fontWeight: 400,
                  color: palette.textMuted,
                  overflow: "hidden",
                  whiteSpace: "nowrap" as const,
                },
              },
              body.tournamentCountry &&
                flagMap.get(body.tournamentCountry.toLowerCase())
                ? h("img", {
                    src: flagMap.get(body.tournamentCountry.toLowerCase())!,
                    width: 16,
                    height: 11,
                    style: { borderRadius: 2, flexShrink: 0 },
                  })
                : null,
              h(
                "div",
                {
                  style: {
                    display: "flex",
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap" as const,
                  },
                },
                meta,
              ),
            )
          : null,
      ),
    ),
    // Player summary band — single row: [flag + name] on the left (flex:1,
    // ellipsizes) and a stacked stats column on the right (placement stamp on
    // top, record/seed below). Differentiates from set-row chrome (which uses
    // a left-border accent) with a full-perimeter subtle border and an
    // accent-tinted placement stamp pill.
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "row" as const,
          alignItems: "center",
          gap: 14,
          margin: "0 16px 14px",
          padding: "12px 14px 12px",
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.03)",
          border: `1px solid ${palette.borderSubtle}`,
        },
      },
      // Left: avatar + tag column (flag + prefix inline on top row, name below)
      playerIcon
        ? h("img", {
            src: playerIcon,
            width: 44,
            height: 44,
            style: {
              borderRadius: 8,
              flexShrink: 0,
              objectFit: "cover" as const,
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
            overflow: "hidden",
          },
        },
        // Top line: flag + prefix, both small. Hidden entirely if neither.
        player.prefix ||
          (player.country && flagMap.get(player.country.toLowerCase()))
          ? h(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "row" as const,
                  alignItems: "center",
                  gap: 5,
                  overflow: "hidden",
                  lineHeight: 1.2,
                },
              },
              player.country && flagMap.get(player.country.toLowerCase())
                ? h("img", {
                    src: flagMap.get(player.country.toLowerCase())!,
                    width: 14,
                    height: 10,
                    style: { borderRadius: 2, flexShrink: 0 },
                  })
                : null,
              player.prefix
                ? h(
                    "div",
                    {
                      style: {
                        display: "flex",
                        fontSize: 11,
                        fontWeight: 500,
                        color: palette.textMuted,
                        letterSpacing: 0.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      },
                    },
                    player.prefix,
                  )
                : null,
            )
          : null,
        h(
          "div",
          {
            style: {
              display: "flex",
              fontSize: 19,
              fontWeight: 800,
              color: palette.textPrimary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
              lineHeight: 1.15,
            },
          },
          player.name,
        ),
        // Most-impactful ranking under the name, rendered as the same
        // accent-tinted pill used for opponent rankings in set rows.
        player.rankings.length > 0
          ? h(
              "div",
              {
                style: {
                  display: "flex",
                  alignSelf: "flex-start" as const,
                  alignItems: "center",
                  marginTop: 3,
                  maxWidth: 240,
                  paddingTop: 2,
                  paddingBottom: 2,
                  paddingLeft: 7,
                  paddingRight: 7,
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  lineHeight: 1,
                  color: palette.accent,
                  backgroundColor: palette.accentRowBg,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap" as const,
                },
              },
              `${player.rankings[0].displayTitle ?? player.rankings[0].title} #${player.rankings[0].rank}`,
            )
          : null,
      ),
      // Right: stats column. Placement is rendered as an accent-tinted stamp
      // pill (replaces the previous flat "Nth / M" row — set rows are
      // unaffected); record/seed sits below it.
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "flex-end",
            gap: 6,
            flexShrink: 0,
          },
        },
        player.placement
          ? h(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "row" as const,
                  alignItems: "baseline",
                  gap: 4,
                  paddingTop: 4,
                  paddingBottom: 4,
                  paddingLeft: 10,
                  paddingRight: 10,
                  borderRadius: 999,
                  backgroundColor: palette.accentRowBg,
                },
              },
              h(
                "div",
                {
                  style: {
                    display: "flex",
                    fontSize: 18,
                    fontWeight: 800,
                    color: palette.accent,
                    lineHeight: 1,
                    letterSpacing: 0.2,
                  },
                },
                `${player.placement}${ordinal(player.placement)}`,
              ),
              body.numEntrants > 0
                ? h(
                    "div",
                    {
                      style: {
                        display: "flex",
                        fontSize: 11,
                        fontWeight: 500,
                        color: palette.accent,
                        opacity: 0.7,
                      },
                    },
                    `/ ${body.numEntrants}`,
                  )
                : null,
            )
          : h(
              "div",
              {
                style: {
                  display: "flex",
                  fontSize: 19,
                  fontWeight: 800,
                  color: palette.textPrimary,
                },
              },
              "—",
            ),
        buildRecordSeedRow(player, palette),
      ),
    ),
    // Set list, sectioned by phase (display:flex with zero children would
    // crash satori; render a single placeholder row instead).
    sets.length > 0
      ? h(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column" as const,
              gap: 10,
              padding: "6px 14px 12px",
            },
          },
          ...groupSetsByPhase(sets).map((group) =>
            buildPhaseSection(
              group,
              palette,
              iconMap,
              flagMap,
              fallbackCharacterId,
            ),
          ),
        )
      : h(
          "div",
          {
            style: {
              padding: "20px 16px",
              fontSize: 11,
              color: palette.textMuted,
              textAlign: "center" as const,
            },
          },
          "No completed sets.",
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

// --- Cache key ---

function canonicalize(body: RequestBody): string {
  return JSON.stringify({
    tournamentName: body.tournamentName ?? "",
    eventName: body.eventName ?? "",
    tournamentDate: body.tournamentDate ?? "",
    tournamentIconUrl: body.tournamentIconUrl ?? "",
    tournamentCountry: body.tournamentCountry ?? null,
    numEntrants: body.numEntrants ?? 0,
    palette: body.palette ?? null,
    locale: body.locale ?? "",
    player: body.player,
    fallbackCharacterId: body.fallbackCharacterId ?? null,
    sets: body.sets.map((s) => ({
      id: s.id,
      fullRoundText: s.fullRoundText,
      scoreSelf: s.scoreSelf,
      scoreOpponent: s.scoreOpponent,
      didWin: s.didWin,
      isDQ: s.isDQ,
      upsetFactor: s.upsetFactor ?? null,
      phaseId: s.phaseId,
      phaseName: s.phaseName,
      selfCharacters: s.selfCharacters,
      opponent: s.opponent,
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

function asNonNegInt(value: unknown, field: string): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    throw new BadRequestError(`Field ${field} must be a non-negative integer`);
  }
  return n;
}

function asBool(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new BadRequestError(`Field ${field} must be a boolean`);
  }
  return value;
}

function asCharacterIds(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new BadRequestError(`Field ${field} must be an array`);
  }
  if (value.length > MAX_CHARACTERS_PER_SIDE) {
    throw new BadRequestError(`Field ${field} exceeds max characters`);
  }
  return value.map((v, i) => {
    if (typeof v !== "string" || v.length === 0 || v.length > 32) {
      throw new BadRequestError(`${field}[${i}] invalid`);
    }
    if (!/^[A-Za-z0-9_-]+$/.test(v)) {
      throw new BadRequestError(`${field}[${i}] disallowed characters`);
    }
    return v;
  });
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

  if (!obj.player || typeof obj.player !== "object") {
    throw new BadRequestError("player is required");
  }
  const p = obj.player as Record<string, unknown>;

  if (!Array.isArray(obj.sets)) {
    throw new BadRequestError("sets must be an array");
  }
  if (obj.sets.length > MAX_SETS) {
    throw new BadRequestError(`sets exceeds max of ${MAX_SETS}`);
  }

  const sets: ResultSet[] = obj.sets.map((s, i) => {
    if (!s || typeof s !== "object") {
      throw new BadRequestError(`sets[${i}] must be an object`);
    }
    const item = s as Record<string, unknown>;
    const opp = item.opponent;
    if (!opp || typeof opp !== "object") {
      throw new BadRequestError(`sets[${i}].opponent must be an object`);
    }
    const oppObj = opp as Record<string, unknown>;
    const upsetRaw = item.upsetFactor;
    let upsetFactor: number | undefined;
    if (upsetRaw !== undefined && upsetRaw !== null) {
      const n = typeof upsetRaw === "number" ? upsetRaw : Number(upsetRaw);
      if (!Number.isFinite(n) || n < 0) {
        throw new BadRequestError(`sets[${i}].upsetFactor invalid`);
      }
      upsetFactor = n;
    }
    let oppFallback: string | null | undefined = undefined;
    if (
      oppObj.fallbackCharacterId !== undefined &&
      oppObj.fallbackCharacterId !== null
    ) {
      const rawF = oppObj.fallbackCharacterId;
      if (typeof rawF !== "string" || rawF.length === 0 || rawF.length > 32) {
        throw new BadRequestError(
          `sets[${i}].opponent.fallbackCharacterId invalid`,
        );
      }
      if (!/^[A-Za-z0-9_-]+$/.test(rawF)) {
        throw new BadRequestError(
          `sets[${i}].opponent.fallbackCharacterId disallowed characters`,
        );
      }
      oppFallback = rawF;
    }
    let oppTopRanking: PlayerRanking | undefined;
    if (oppObj.topRanking != null) {
      if (typeof oppObj.topRanking !== "object") {
        throw new BadRequestError(`sets[${i}].opponent.topRanking invalid`);
      }
      const tr = oppObj.topRanking as Record<string, unknown>;
      oppTopRanking = {
        title: asBoundedString(
          tr.title,
          `sets[${i}].opponent.topRanking.title`,
        ),
        rank: asNonNegInt(tr.rank, `sets[${i}].opponent.topRanking.rank`),
        displayTitle: asOptionalBoundedString(
          tr.displayTitle,
          `sets[${i}].opponent.topRanking.displayTitle`,
        ),
      };
    }
    return {
      id: asBoundedString(item.id, `sets[${i}].id`),
      fullRoundText: asBoundedString(
        item.fullRoundText,
        `sets[${i}].fullRoundText`,
      ),
      scoreSelf: asNonNegInt(item.scoreSelf, `sets[${i}].scoreSelf`),
      scoreOpponent: asNonNegInt(
        item.scoreOpponent,
        `sets[${i}].scoreOpponent`,
      ),
      didWin: asBool(item.didWin, `sets[${i}].didWin`),
      isDQ: asBool(item.isDQ, `sets[${i}].isDQ`),
      upsetFactor,
      phaseId:
        asOptionalBoundedString(item.phaseId, `sets[${i}].phaseId`) ??
        "unknown",
      phaseName:
        asOptionalBoundedString(item.phaseName, `sets[${i}].phaseName`) ??
        "Other",
      selfCharacters: asCharacterIds(
        item.selfCharacters,
        `sets[${i}].selfCharacters`,
      ),
      opponent: {
        name: asBoundedString(oppObj.name, `sets[${i}].opponent.name`),
        prefix: asOptionalBoundedString(
          oppObj.prefix,
          `sets[${i}].opponent.prefix`,
        ),
        country: asOptionalBoundedString(
          oppObj.country,
          `sets[${i}].opponent.country`,
        ),
        seed: asNonNegInt(oppObj.seed, `sets[${i}].opponent.seed`),
        placement: asNonNegInt(
          oppObj.placement,
          `sets[${i}].opponent.placement`,
        ),
        characters: asCharacterIds(
          oppObj.characters,
          `sets[${i}].opponent.characters`,
        ),
        fallbackCharacterId: oppFallback,
        topRanking: oppTopRanking,
      },
    };
  });

  const iconUrlRaw = asOptionalBoundedString(
    obj.tournamentIconUrl,
    "tournamentIconUrl",
  );
  let tournamentIconUrl = "";
  if (iconUrlRaw) {
    parseImageUrl(iconUrlRaw);
    tournamentIconUrl = iconUrlRaw;
  }

  let fallbackCharacterId: string | null | undefined = undefined;
  if (
    obj.fallbackCharacterId !== undefined &&
    obj.fallbackCharacterId !== null
  ) {
    const raw = obj.fallbackCharacterId;
    if (typeof raw !== "string" || raw.length === 0 || raw.length > 32) {
      throw new BadRequestError("fallbackCharacterId invalid");
    }
    if (!/^[A-Za-z0-9_-]+$/.test(raw)) {
      throw new BadRequestError("fallbackCharacterId disallowed characters");
    }
    fallbackCharacterId = raw;
  }

  let tournamentCountry: string | undefined;
  if (
    obj.tournamentCountry !== undefined &&
    obj.tournamentCountry !== null &&
    obj.tournamentCountry !== ""
  ) {
    const raw = obj.tournamentCountry;
    if (typeof raw !== "string" || !/^[A-Za-z]{2}$/.test(raw)) {
      throw new BadRequestError(
        "tournamentCountry must be an ISO 3166-1 alpha-2",
      );
    }
    tournamentCountry = raw.toLowerCase();
  }

  let playerIconUrl: string | undefined;
  const playerIconRaw = asOptionalBoundedString(p.iconUrl, "player.iconUrl");
  if (playerIconRaw) {
    parseImageUrl(playerIconRaw);
    playerIconUrl = playerIconRaw;
  }

  const MAX_RANKINGS = 8;
  const rankings: PlayerRanking[] = [];
  if (Array.isArray(p.rankings)) {
    if (p.rankings.length > MAX_RANKINGS) {
      throw new BadRequestError(
        `player.rankings exceeds max of ${MAX_RANKINGS}`,
      );
    }
    for (let i = 0; i < p.rankings.length; i++) {
      const r = p.rankings[i];
      if (!r || typeof r !== "object") {
        throw new BadRequestError(`player.rankings[${i}] must be an object`);
      }
      const item = r as Record<string, unknown>;
      rankings.push({
        title: asBoundedString(item.title, `player.rankings[${i}].title`),
        rank: asNonNegInt(item.rank, `player.rankings[${i}].rank`),
        displayTitle: asOptionalBoundedString(
          item.displayTitle,
          `player.rankings[${i}].displayTitle`,
        ),
      });
    }
  }

  return {
    tournamentName:
      asOptionalBoundedString(obj.tournamentName, "tournamentName") ?? "",
    eventName: asOptionalBoundedString(obj.eventName, "eventName") ?? "",
    tournamentDate:
      asOptionalBoundedString(obj.tournamentDate, "tournamentDate") ?? "",
    tournamentIconUrl,
    tournamentCountry,
    numEntrants: asNonNegInt(obj.numEntrants ?? 0, "numEntrants"),
    palette: obj.palette as PredictionPalette | undefined,
    locale: asOptionalBoundedString(obj.locale, "locale"),
    player: {
      name: asBoundedString(p.name, "player.name"),
      prefix: asOptionalBoundedString(p.prefix, "player.prefix"),
      country: asOptionalBoundedString(p.country, "player.country"),
      iconUrl: playerIconUrl,
      rankings,
      seed: asNonNegInt(p.seed ?? 0, "player.seed"),
      placement: asNonNegInt(p.placement ?? 0, "player.placement"),
      wins: asNonNegInt(p.wins ?? 0, "player.wins"),
      losses: asNonNegInt(p.losses ?? 0, "player.losses"),
    },
    fallbackCharacterId,
    sets,
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

  addBreadcrumb("results-image", "fetch_assets_start");
  const [tournamentIcon, playerIcon, iconMap, flagMap] = await Promise.all([
    fetchTournamentIcon(body.tournamentIconUrl),
    body.player.iconUrl ? fetchTournamentIcon(body.player.iconUrl) : null,
    preloadCharacterIcons(body.sets, [
      body.fallbackCharacterId,
      ...body.sets.map((s) => s.opponent.fallbackCharacterId),
    ]),
    preloadFlags([
      body.player.country,
      body.tournamentCountry,
      ...body.sets.map((s) => s.opponent.country),
    ]),
  ]);
  addBreadcrumb("results-image", "fetch_assets_done", {
    hasIcon: tournamentIcon != null,
    hasPlayerIcon: playerIcon != null,
    characterCount: iconMap.size,
    flagCount: flagMap.size,
  });

  const palette: PredictionPalette = {
    ...DEFAULT_PALETTE,
    ...(body.palette ?? {}),
  };

  const graphic = buildGraphic(
    body,
    tournamentIcon,
    playerIcon,
    iconMap,
    flagMap,
    palette,
  );

  addBreadcrumb("results-image", "satori_start", {
    setCount: body.sets.length,
  });
  // Auto-height: omit `height` so satori fits the rendered content. The root
  // div has no fixed height; Resvg then scales the resulting SVG to OUTPUT_WIDTH
  // while preserving the aspect ratio satori computed.
  const svg = await satori(graphic, {
    width: WIDTH,
    fonts: [
      { name: "M PLUS Rounded 1c", data: fontRegular, weight: 400 },
      { name: "M PLUS Rounded 1c", data: fontBold, weight: 800 },
    ],
  });
  addBreadcrumb("results-image", "satori_done");

  addBreadcrumb("results-image", "resvg_start");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width" as const, value: OUTPUT_WIDTH },
    font: { loadSystemFonts: false },
  });
  const png = Buffer.from(resvg.render().asPng());
  addBreadcrumb("results-image", "resvg_done", { bytes: png.length });

  lruSet(pngCache, hash, png, PNG_CACHE_MAX);
  res.setHeader("X-Cache", "MISS");
  return res.status(200).send(png);
};

export default withLogging("results-image", handler);
