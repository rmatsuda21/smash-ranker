// The "Path" layout of the results graphic: a compact header, then the run
// drawn as a line through the bracket. The line stays in the winners lane,
// crosses to the losers lane where the player dropped, and its markers are the
// characters the player used in each set.
//
// Everything is laid out from fixed row heights (ROW_H, PHASE_H), because the
// rail is drawn with absolute coordinates beside the rows. Change a row's
// height only through those constants.
import React from "react";

import {
  abbreviateRound,
  definedStyle,
  estimateTextWidth,
  groupSetsByPhase,
  ordinal,
  seedTierServer,
  upsetTier,
  withAlpha,
  type PlayerInfo,
  type PlayerRanking,
  type PredictionPalette,
  type RequestBody,
  type ResultSet,
} from "./resultsImageShared.js";

// Barlow has no Japanese. satori measures a word with the family it was given
// but draws the whole word in the fallback font as soon as one glyph is
// missing, so a name like "あcola" got a box sized for Barlow, was drawn wider
// in M PLUS Rounded 1c, and lost its last letters to the box. Any text holding a
// character outside Latin is therefore set in the fallback font outright, so
// it is measured in the font it is drawn in.
const FALLBACK_FONT = "M PLUS Rounded 1c";
const needsFallbackFont = (text: string): boolean =>
  /[^\u0020-\u024f\u2000-\u206f\u2190-\u22ff]/.test(text);

// createElement, plus the font rule above for an element whose only child is
// a string. Every text box in this file is built that way.
function h(
  type: string,
  props?: Record<string, unknown> | null,
  ...children: React.ReactNode[]
): React.ReactElement {
  const only = children.length === 1 ? children[0] : null;
  if (typeof only === "string" && needsFallbackFont(only)) {
    const style = (props?.style ?? {}) as React.CSSProperties;
    return React.createElement(
      type,
      { ...props, style: { ...style, fontFamily: FALLBACK_FONT } },
      only,
    );
  }
  return React.createElement(type, props, ...children);
}

export type PathGraphicInput = {
  body: RequestBody;
  tournamentIcon: string | null;
  playerIcon: string | null;
  iconMap: Map<string, string>;
  flagMap: Map<string, string>;
  palette: PredictionPalette;
};

const MIN_WIDTH = 540;
const MAX_WIDTH = 640;
const PAD_X = 24;
const RAIL_W = 64;
const LANE_X = { w: 18, l: 42 } as const;
const ROW_H = 42;
const PHASE_H = 26;
const ROW_GAP = 10;
const ROUND_W = 32;
const SEED_FONT = 11.5;
const UF_W = 46;
const SCORE_W = 42;
const SCORE_DIGIT_W = 14;
const SCORE_DASH_W = 10;
const OPP_ICON = 22;
const NAME_FONT = 15;
const RANK_FONT = 10.5;

const TEXT_FONT = "Barlow";
const NUM_FONT = "Barlow Condensed";
// The top upset tier is gold on every palette, as in the other layouts.
const GOLD = "#ffcf4a";
const GOLD_INK = "#2a1c00";

type Lane = keyof typeof LANE_X;

type Theme = {
  bg: string;
  text: string;
  mut: string;
  acc: string;
  line: string;
  foot: string;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

// The graphic's few words, in the two languages the site ships. Player and
// tournament names, round codes and "UF" are the same in both.
type Strings = {
  record: (wins: number, losses: number) => [string, string];
  games: (won: number, lost: number) => [string, string, string];
  seed: (n: number) => string;
  finish: (n: number) => string;
  place: (n: number) => [string, string];
  of: (n: number) => string;
  atSeed: string;
  legend: string;
  noSets: string;
};

const EN: Strings = {
  record: (w, l) => [`${w}–${l}`, "sets"],
  games: (w, l) => ["", `${w}–${l}`, "games"],
  seed: (n) => `seed ${n}`,
  finish: (n) => `${n}${ordinal(n)}`,
  place: (n) => [String(n), ordinal(n).toUpperCase()],
  of: (n) => `of ${n}`,
  atSeed: "at seed",
  legend: "W winners side · L losers side · UF upset factor",
  noSets: "No completed sets.",
};

const JA: Strings = {
  record: (w, l) => [`${w}勝${l}敗`, ""],
  games: (w, l) => ["ゲーム", `${w}–${l}`, ""],
  seed: (n) => `シード${n}`,
  finish: (n) => `${n}位`,
  place: (n) => [String(n), "位"],
  of: (n) => `${n}人中`,
  atSeed: "シード通り",
  legend: "W 勝者側 · L 敗者側 · UF アップセットファクター",
  noSets: "完了した試合がありません。",
};

const stringsFor = (locale: string | undefined): Strings =>
  locale?.toLowerCase().startsWith("ja") ? JA : EN;

// Barlow is narrower than the font `estimateTextWidth` was tuned for.
const textWidth = (text: string, fontSize: number): number =>
  estimateTextWidth(text, fontSize) * (needsFallbackFont(text) ? 1 : 0.9);

const hasUpset = (set: ResultSet): boolean =>
  set.upsetFactor !== undefined && set.upsetFactor > 0;

const seedText = (set: ResultSet, t: Strings): string => {
  const { seed, placement } = set.opponent;
  if (seed && placement) return `${t.seed(seed)} · ${t.finish(placement)}`;
  if (seed) return t.seed(seed);
  return placement ? t.finish(placement) : "";
};

// The seed column is as wide as its longest entry, so the entries line up on
// the right in either language.
const seedColumnWidth = (sets: ResultSet[], t: Strings): number =>
  Math.ceil(
    Math.max(0, ...sets.map((set) => textWidth(seedText(set, t), SEED_FONT))),
  ) + 6;

// Canvas width: the base width, grown by however much the longest opponent
// name overflows its column. Longer names are ellipsized by the row.
export function pathImageWidth(body: RequestBody): number {
  if (body.sets.length === 0) return MIN_WIDTH;
  const anyUpset = body.sets.some(hasUpset);
  const fixed =
    PAD_X * 2 +
    RAIL_W +
    ROUND_W +
    seedColumnWidth(body.sets, stringsFor(body.locale)) +
    SCORE_W +
    (anyUpset ? UF_W + ROW_GAP : 0) +
    ROW_GAP * 4;
  const widest = Math.max(
    ...body.sets.map((set) => {
      const icons = Math.max(1, Math.min(2, set.opponent.characters.length));
      const name = set.opponent.prefix
        ? `${set.opponent.prefix} | ${set.opponent.name}`
        : set.opponent.name;
      const ranking = set.opponent.topRanking;
      const rankingWidth = ranking
        ? textWidth(
            `${(ranking.displayTitle ?? ranking.title).toUpperCase()} #${ranking.rank}`,
            RANK_FONT,
          ) + 12
        : 0;
      return (
        icons * (OPP_ICON + 3) +
        Math.max(textWidth(name, NAME_FONT) + 18, rankingWidth)
      );
    }),
  );
  const needed = Math.ceil(fixed + widest);
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, needed));
}

// --- Header ---

function buildTopLine(
  input: PathGraphicInput,
  theme: Theme,
): React.ReactElement {
  const { body, tournamentIcon, flagMap } = input;
  const date = body.tournamentDate
    ? DATE_FORMATTER.format(new Date(body.tournamentDate))
    : "";
  const meta = [body.eventName, date].filter(Boolean).join(" · ");
  const flag =
    body.tournamentCountry && flagMap.get(body.tournamentCountry.toLowerCase());
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 12.5,
        color: theme.mut,
      },
    },
    tournamentIcon
      ? h("img", {
          src: tournamentIcon,
          width: 24,
          height: 24,
          style: { borderRadius: 6, flexShrink: 0 },
        })
      : null,
    h(
      "div",
      {
        style: {
          display: "flex",
          flex: 1,
          minWidth: 0,
          fontWeight: 600,
          color: theme.text,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap" as const,
        },
      },
      body.tournamentName,
    ),
    flag
      ? h("img", {
          src: flag,
          width: 15,
          height: 10,
          style: { borderRadius: 2, flexShrink: 0 },
        })
      : null,
    meta
      ? h(
          "div",
          {
            style: {
              display: "flex",
              flexShrink: 0,
              maxWidth: 240,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
            },
          },
          meta,
        )
      : null,
  );
}

// The characters the player used across the run, most used first.
function playedCharacters(
  sets: ResultSet[],
  iconMap: Map<string, string>,
): string[] {
  const counts = new Map<string, number>();
  for (const set of sets) {
    for (const id of set.selfCharacters) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .filter((id) => iconMap.has(id))
    .slice(0, 3);
}

function buildHero(
  input: PathGraphicInput,
  theme: Theme,
  t: Strings,
): React.ReactElement {
  const { body, playerIcon, iconMap, flagMap } = input;
  const { player, sets } = body;

  let gamesWon = 0;
  let gamesLost = 0;
  for (const set of sets) {
    if (set.isDQ) continue;
    gamesWon += set.scoreSelf;
    gamesLost += set.scoreOpponent;
  }

  const strong = (text: string) =>
    h(
      "div",
      { style: { display: "flex", fontWeight: 600, color: theme.text } },
      text,
    );
  const plain = (text: string) =>
    h("div", { style: { display: "flex" } }, text);
  const dot = () => plain("·");

  const [recordValue, recordLabel] = t.record(player.wins, player.losses);
  const [gamesBefore, gamesValue, gamesAfter] = t.games(gamesWon, gamesLost);
  const played = playedCharacters(sets, iconMap);
  const flag = player.country && flagMap.get(player.country.toLowerCase());

  const subLine: React.ReactElement[] = [
    ...(flag
      ? [
          h("img", {
            key: "flag",
            src: flag,
            width: 15,
            height: 10,
            style: { borderRadius: 2, flexShrink: 0 },
          }),
        ]
      : []),
    strong(recordValue),
    ...(recordLabel ? [plain(recordLabel)] : []),
    ...(gamesWon + gamesLost > 0
      ? [
          dot(),
          ...(gamesBefore ? [plain(gamesBefore)] : []),
          strong(gamesValue),
          ...(gamesAfter ? [plain(gamesAfter)] : []),
        ]
      : []),
    ...(played.length > 0
      ? [
          dot(),
          ...played.map((id) =>
            h("img", {
              key: id,
              src: iconMap.get(id)!,
              width: 16,
              height: 16,
              style: { flexShrink: 0 },
            }),
          ),
        ]
      : []),
  ];

  const [placeNumber, placeSuffix] = player.placement
    ? t.place(player.placement)
    : ["—", ""];

  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginTop: 12,
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12,
          flex: 1,
          minWidth: 0,
        },
      },
      playerIcon
        ? h("img", {
            src: playerIcon,
            width: 44,
            height: 44,
            style: {
              borderRadius: 10,
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
          },
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              minWidth: 0,
              fontFamily: NUM_FONT,
              fontWeight: 700,
              fontSize: 30,
              lineHeight: 1,
            },
          },
          player.prefix
            ? h(
                "div",
                {
                  style: {
                    display: "flex",
                    flexShrink: 0,
                    fontWeight: 600,
                    fontSize: 20,
                    color: theme.mut,
                  },
                },
                player.prefix,
              )
            : null,
          h(
            "div",
            {
              style: {
                display: "flex",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
                // The fallback font is wider and heavier than Barlow Condensed.
                fontSize: needsFallbackFont(player.name) ? 25 : 30,
              },
            },
            player.name,
          ),
          player.rankings.length > 0
            ? h(
                "div",
                {
                  style: {
                    display: "flex",
                    flexShrink: 1,
                    minWidth: 0,
                    marginLeft: 4,
                  },
                },
                buildRanking(player.rankings[0], theme, 12),
              )
            : null,
        ),
        h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 5,
              fontSize: 12,
              color: theme.mut,
            },
          },
          ...subLine,
        ),
      ),
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "flex-start",
          flexShrink: 0,
          fontFamily: NUM_FONT,
          fontWeight: 700,
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            fontSize: 60,
            lineHeight: 0.8,
            color: theme.acc,
          },
        },
        placeNumber,
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column" as const,
            justifyContent: "space-between",
            height: 46,
            marginLeft: 3,
          },
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              fontSize: 20,
              lineHeight: 1,
              color: theme.acc,
            },
          },
          placeSuffix || " ",
        ),
        body.numEntrants > 0
          ? h(
              "div",
              {
                style: {
                  display: "flex",
                  fontFamily: TEXT_FONT,
                  fontWeight: 400,
                  fontSize: 11.5,
                  lineHeight: 1,
                  color: theme.mut,
                },
              },
              t.of(body.numEntrants),
            )
          : null,
      ),
    ),
  );
}

// Seed and placement on one bar, counted in placement tiers (1st, 2nd, 3rd,
// 4th, 5th–6th, 7th–8th, 9th–12th, ...), one tick per tier, so the same gain
// is the same distance at any bracket size. Returns null when either number is
// missing.
function buildSeedTrack(
  player: PlayerInfo,
  numEntrants: number,
  width: number,
  theme: Theme,
  t: Strings,
): React.ReactElement | null {
  const seedTier = seedTierServer(player.seed);
  const placeTier = seedTierServer(player.placement);
  if (seedTier == null || placeTier == null) return null;

  const lastTier = Math.max(
    seedTierServer(numEntrants) ?? 0,
    seedTier,
    placeTier,
    1,
  );
  const x = (tier: number) => ((lastTier - tier) / lastTier) * width;
  const seedX = x(seedTier);
  const placeX = x(placeTier);
  const delta = seedTier - placeTier;
  const tone = delta > 0 ? theme.acc : delta < 0 ? theme.mut : theme.text;

  const deltaText =
    delta > 0 ? `+${delta}` : delta < 0 ? `−${-delta}` : t.atSeed;
  const labelParts: Array<[string, string, number]> = [
    [t.seed(player.seed), theme.text, 600],
    ["→", theme.mut, 400],
    [t.finish(player.placement), theme.text, 600],
    [deltaText, delta > 0 ? theme.acc : theme.mut, 600],
  ];
  const LABEL_FONT = 11.5;
  const LABEL_GAP = 4;
  const labelWidth =
    labelParts.reduce((sum, [text]) => sum + textWidth(text, LABEL_FONT), 0) +
    LABEL_GAP * (labelParts.length - 1);
  const labelLeft = Math.min(
    Math.max(0, placeX - labelWidth / 2),
    Math.max(0, width - labelWidth),
  );

  const ticks = Array.from({ length: lastTier + 1 }, (_, i) =>
    h("div", {
      key: `tick-${i}`,
      style: {
        position: "absolute" as const,
        left: Math.min(Math.round((i / lastTier) * width), width - 1),
        top: 20,
        width: 1,
        height: 8,
        backgroundColor: "rgba(255,255,255,0.24)",
      },
    }),
  );

  const dot = (left: number, filled: boolean) =>
    h("div", {
      style: {
        position: "absolute" as const,
        left: left - 5,
        top: 19,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: filled ? tone : theme.bg,
        border: `2px solid ${filled ? tone : theme.text}`,
      },
    });

  return h(
    "div",
    {
      style: {
        display: "flex",
        position: "relative" as const,
        width,
        height: 30,
        marginTop: 8,
      },
    },
    h("div", {
      style: {
        position: "absolute" as const,
        left: 0,
        top: 23,
        width,
        height: 2,
        backgroundColor: "rgba(255,255,255,0.14)",
      },
    }),
    ...ticks,
    delta !== 0
      ? h("div", {
          style: {
            position: "absolute" as const,
            left: Math.min(seedX, placeX),
            top: 22,
            width: Math.abs(seedX - placeX),
            height: 4,
            borderRadius: 2,
            backgroundColor: tone,
          },
        })
      : null,
    delta !== 0 ? dot(seedX, false) : null,
    dot(placeX, true),
    h(
      "div",
      {
        style: {
          display: "flex",
          position: "absolute" as const,
          left: labelLeft,
          top: 0,
          gap: LABEL_GAP,
          fontSize: LABEL_FONT,
          lineHeight: 1.2,
          whiteSpace: "nowrap" as const,
        },
      },
      ...labelParts.map(([text, color, fontWeight], i) =>
        h(
          "div",
          { key: i, style: { display: "flex", color, fontWeight } },
          text,
        ),
      ),
    ),
  );
}

// --- Rail ---

// Which lane each set is drawn in. start.gg names bracket rounds "Winners …"
// and "Losers …"; a grand final stays in the lane the player arrived from, and
// anything else (round robin pools, "Round 3") counts as the winners lane.
function lanesFor(sets: ResultSet[]): Lane[] {
  let previous: Lane = "w";
  return sets.map((set) => {
    const round = set.fullRoundText.trim().toLowerCase();
    const lane: Lane = round.startsWith("losers")
      ? "l"
      : round.startsWith("grand")
        ? previous
        : "w";
    previous = lane;
    return lane;
  });
}

type RailNode = { set: ResultSet; lane: Lane; x: number; y: number };

function layoutRail(sets: ResultSet[]): { nodes: RailNode[]; height: number } {
  const lanes = lanesFor(sets);
  const nodes: RailNode[] = [];
  let y = 0;
  let index = 0;
  for (const group of groupSetsByPhase(sets)) {
    y += PHASE_H;
    for (const set of group.sets) {
      const lane = lanes[index++];
      nodes.push({ set, lane, x: LANE_X[lane], y: y + ROW_H / 2 });
      y += ROW_H;
    }
  }
  return { nodes, height: y };
}

function buildRail(
  nodes: RailNode[],
  height: number,
  input: PathGraphicInput,
  theme: Theme,
): React.ReactElement[] {
  const { iconMap } = input;
  const laneColor = (lane: Lane) => (lane === "w" ? theme.acc : theme.mut);
  const stroke = (d: string, color: string, key: string) =>
    h("path", { key, d, stroke: color, strokeWidth: 2.5, fill: "none" });

  const lines: React.ReactElement[] = [];
  const first = nodes[0];
  lines.push(
    stroke(
      `M${first.x} ${first.y - ROW_H / 2 + 4}V${first.y}`,
      laneColor(first.lane),
      "start",
    ),
  );
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const dy = b.y - a.y;
    const d =
      a.x === b.x
        ? `M${a.x} ${a.y}V${b.y}`
        : `M${a.x} ${a.y}C${a.x} ${a.y + dy * 0.62} ${b.x} ${a.y + dy * 0.38} ${b.x} ${b.y}`;
    lines.push(stroke(d, laneColor(b.lane), `seg-${i}`));
  }
  // A run that ends on a loss is capped: the player went out here.
  const last = nodes[nodes.length - 1];
  if (!last.set.didWin) {
    const end = last.y + ROW_H / 2 - 4;
    lines.push(
      stroke(
        `M${last.x} ${last.y}V${end}M${last.x - 6} ${end}H${last.x + 6}`,
        theme.mut,
        "cap",
      ),
    );
  }

  // A set with a known character is marked by that character; the others
  // keep a plain dot.
  const characterOf = (node: RailNode, slot: number): string | undefined => {
    if (node.set.isDQ) return undefined;
    const id = node.set.selfCharacters[slot];
    return id ? iconMap.get(id) : undefined;
  };

  const dots = nodes
    .filter((node) => !characterOf(node, 0))
    .map((node, i) =>
      node.set.didWin
        ? h("circle", {
            key: `dot-${i}`,
            cx: node.x,
            cy: node.y,
            r: 5.5,
            fill: theme.acc,
          })
        : h("circle", {
            key: `dot-${i}`,
            cx: node.x,
            cy: node.y,
            r: 5,
            fill: theme.bg,
            stroke: theme.mut,
            strokeWidth: 2.5,
          }),
    );

  const marker = (
    src: string,
    won: boolean,
    x: number,
    y: number,
    size: number,
    key: string,
  ) =>
    h(
      "div",
      {
        key,
        style: {
          display: "flex",
          position: "absolute" as const,
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.bg,
          border: `2px solid ${won ? theme.acc : theme.mut}`,
        },
      },
      h("img", {
        src,
        width: size - 9,
        height: size - 9,
        style: definedStyle({
          filter: won ? undefined : "grayscale(0.8)",
          opacity: won ? 1 : 0.7,
        }),
      }),
    );

  const markers: React.ReactElement[] = [];
  nodes.forEach((node, i) => {
    const primary = characterOf(node, 0);
    if (!primary) return;
    const secondary = characterOf(node, 1);
    if (secondary) {
      // The second character sits towards the lane the line is not in.
      const offset = node.lane === "w" ? 15 : -15;
      markers.push(
        marker(
          secondary,
          node.set.didWin,
          node.x + offset,
          node.y,
          22,
          `m2-${i}`,
        ),
      );
    }
    markers.push(
      marker(primary, node.set.didWin, node.x, node.y, 26, `m1-${i}`),
    );
  });

  const laneLabel = (lane: Lane, text: string) =>
    h(
      "div",
      {
        key: `lane-${lane}`,
        style: {
          display: "flex",
          position: "absolute" as const,
          left: LANE_X[lane] - 10,
          top: 0,
          width: 20,
          height: PHASE_H,
          alignItems: "center",
          justifyContent: "center",
          fontFamily: NUM_FONT,
          fontWeight: 600,
          fontSize: 11,
          color: theme.mut,
        },
      },
      text,
    );

  return [
    h(
      "svg",
      {
        key: "rail",
        width: RAIL_W,
        height,
        viewBox: `0 0 ${RAIL_W} ${height}`,
        style: { position: "absolute" as const, left: 0, top: 0 },
      },
      ...lines,
      ...dots,
    ),
    laneLabel("w", "W"),
    laneLabel("l", "L"),
    ...markers,
  ];
}

// --- Rows ---

const rankingTitle = (ranking: PlayerRanking): string =>
  ranking.displayTitle ?? ranking.title;

// A player's ranking as a line of small capitals: the ranking's name in the
// accent colour, the rank itself in the text colour. Used above a ranked
// opponent's name and beside the player's own name in the header.
function buildRanking(
  ranking: PlayerRanking,
  theme: Theme,
  fontSize: number,
): React.ReactElement {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 4,
        minWidth: 0,
        fontFamily: NUM_FONT,
        fontWeight: 600,
        fontSize,
        lineHeight: 1,
        letterSpacing: 0.8,
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          minWidth: 0,
          color: theme.acc,
          textTransform: "uppercase" as const,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap" as const,
        },
      },
      rankingTitle(ranking),
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          flexShrink: 0,
          fontWeight: 700,
          color: theme.text,
        },
      },
      `#${ranking.rank}`,
    ),
  );
}

// "UF" and the number in two cells. The badge fills in as the upset grows:
// outline, half filled, solid, then gold.
// A loss the player took as the favourite carries an upset factor too. It is
// drawn as the plain outline at any size, in grey: it is not a highlight.
function buildUpsetBadge(
  uf: number,
  theme: Theme,
  lost: boolean,
): React.ReactElement {
  const tier = lost ? "minor" : upsetTier(uf);
  const frame = {
    minor: { border: "rgba(255,255,255,0.3)", fill: undefined },
    notable: { border: theme.acc, fill: undefined },
    major: { border: theme.acc, fill: theme.acc },
    legendary: { border: GOLD, fill: GOLD },
  }[tier];
  const ink = tier === "legendary" ? GOLD_INK : theme.bg;
  const labelColor = tier === "minor" ? theme.mut : ink;
  const numberColor = lost
    ? theme.mut
    : tier === "minor"
      ? theme.text
      : tier === "notable"
        ? theme.acc
        : ink;

  return h(
    "div",
    {
      style: definedStyle({
        display: "flex",
        alignItems: "stretch",
        flexShrink: 0,
        height: 20,
        borderRadius: 3,
        overflow: "hidden",
        transform: "skewX(-10deg)",
        border: `1px solid ${frame.border}`,
        backgroundColor: frame.fill,
        boxShadow:
          tier === "legendary"
            ? `0 0 10px ${withAlpha(GOLD, 0.55)}`
            : undefined,
        fontFamily: NUM_FONT,
      }),
    },
    h(
      "div",
      {
        style: definedStyle({
          display: "flex",
          alignItems: "center",
          paddingLeft: 4,
          paddingRight: 4,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.8,
          color: labelColor,
          backgroundColor: tier === "notable" ? theme.acc : undefined,
        }),
      },
      "UF",
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 19,
          paddingLeft: 3,
          paddingRight: 4,
          fontSize: 15,
          fontWeight: 700,
          color: numberColor,
        },
      },
      String(uf),
    ),
  );
}

function buildOpponentIcons(
  set: ResultSet,
  iconMap: Map<string, string>,
): React.ReactElement {
  const icons = set.opponent.characters
    .map((id) => iconMap.get(id))
    .filter((src): src is string => Boolean(src))
    .slice(0, 2);
  if (icons.length > 0) {
    return h(
      "div",
      { style: { display: "flex", gap: 3, flexShrink: 0 } },
      ...icons.map((src, i) =>
        h("img", { key: i, src, width: OPP_ICON, height: OPP_ICON }),
      ),
    );
  }
  // No character reported for the set: the opponent's usual character, faded,
  // or an empty slot when that is unknown too.
  const fallback =
    set.opponent.fallbackCharacterId &&
    iconMap.get(set.opponent.fallbackCharacterId);
  if (fallback) {
    return h("img", {
      src: fallback,
      width: OPP_ICON,
      height: OPP_ICON,
      style: { flexShrink: 0, filter: "grayscale(1)", opacity: 0.4 },
    });
  }
  return h("div", {
    style: {
      display: "flex",
      flexShrink: 0,
      width: OPP_ICON,
      height: OPP_ICON,
      borderRadius: 4,
      border: "1px dashed rgba(255,255,255,0.28)",
    },
  });
}

function buildScore(set: ResultSet, theme: Theme): React.ReactElement {
  const base = {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "baseline",
    flexShrink: 0,
    width: SCORE_W,
    fontFamily: NUM_FONT,
    fontWeight: 700,
    lineHeight: 1,
  };
  if (set.isDQ) {
    return h(
      "div",
      { style: { ...base, fontSize: 18, color: theme.mut } },
      "DQ",
    );
  }
  const rest = set.didWin ? theme.text : theme.mut;
  // Each part sits centred in a cell of fixed width, so the dashes and the
  // digits line up down the list whichever digits they are ("1" is narrower
  // than the rest). A two-digit score widens its own cell.
  const cell = (text: string, color: string, minWidth: number) =>
    h(
      "div",
      { style: { display: "flex", justifyContent: "center", minWidth, color } },
      text,
    );
  return h(
    "div",
    { style: { ...base, fontSize: 24 } },
    cell(
      String(set.scoreSelf),
      set.didWin ? theme.acc : theme.mut,
      SCORE_DIGIT_W,
    ),
    cell("–", rest, SCORE_DASH_W),
    cell(String(set.scoreOpponent), rest, SCORE_DIGIT_W),
  );
}

function buildRow(
  set: ResultSet,
  input: PathGraphicInput,
  theme: Theme,
  t: Strings,
  anyUpset: boolean,
  seedWidth: number,
): React.ReactElement {
  const { iconMap, flagMap } = input;
  const { opponent } = set;
  const big = set.didWin && hasUpset(set) && set.upsetFactor! >= 6;
  const flag = opponent.country && flagMap.get(opponent.country.toLowerCase());
  const seedLabel = seedText(set, t);

  return h(
    "div",
    {
      key: set.id,
      style: definedStyle({
        display: "flex",
        alignItems: "center",
        gap: ROW_GAP,
        height: ROW_H,
        borderTop: `1px solid ${theme.line}`,
        opacity: set.isDQ ? 0.6 : 1,
        backgroundImage: big
          ? `linear-gradient(90deg, ${withAlpha(theme.acc, 0)} 35%, ${withAlpha(theme.acc, 0.13)} 100%)`
          : undefined,
      }),
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexShrink: 0,
          width: ROUND_W,
          fontFamily: NUM_FONT,
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: 0.5,
          color: theme.mut,
        },
      },
      abbreviateRound(set.fullRoundText) || "—",
    ),
    buildOpponentIcons(set, iconMap),
    // A ranked opponent gets their ranking on a line above the name. Both
    // lines fit in the row's fixed height, so the rail is not affected.
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column" as const,
          justifyContent: "center",
          gap: 2,
          flex: 1,
          minWidth: 0,
        },
      },
      opponent.topRanking
        ? buildRanking(opponent.topRanking, theme, RANK_FONT)
        : null,
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            fontSize: NAME_FONT,
            fontWeight: 600,
            lineHeight: 1.15,
          },
        },
        flag
          ? h("img", {
              src: flag,
              width: 14,
              height: 10,
              style: { borderRadius: 2, flexShrink: 0 },
            })
          : null,
        // Prefix and name are separate boxes: satori mislays a bare text node
        // next to an element when the parent truncates. Only the name shrinks.
        opponent.prefix
          ? h(
              "div",
              {
                style: {
                  display: "flex",
                  flexShrink: 0,
                  fontWeight: 400,
                  color: theme.mut,
                },
              },
              `${opponent.prefix} |`,
            )
          : null,
        h(
          "div",
          {
            style: {
              display: "flex",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
            },
          },
          opponent.name,
        ),
      ),
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "flex-end",
          flexShrink: 0,
          width: seedWidth,
          fontSize: SEED_FONT,
          color: theme.mut,
          whiteSpace: "nowrap" as const,
        },
      },
      seedLabel || " ",
    ),
    anyUpset
      ? h(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "flex-end",
              flexShrink: 0,
              width: UF_W,
            },
          },
          hasUpset(set)
            ? buildUpsetBadge(set.upsetFactor!, theme, !set.didWin)
            : null,
        )
      : null,
    buildScore(set, theme),
  );
}

function buildPath(
  input: PathGraphicInput,
  theme: Theme,
  t: Strings,
): React.ReactElement {
  const { sets } = input.body;
  const { nodes, height } = layoutRail(sets);
  const anyUpset = sets.some(hasUpset);
  const seedWidth = seedColumnWidth(sets, t);

  const sections = groupSetsByPhase(sets).flatMap((group) => {
    const wins = group.sets.filter((s) => s.didWin).length;
    return [
      h(
        "div",
        {
          key: `phase-${group.id}-${group.sets[0].id}`,
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: PHASE_H,
            fontFamily: NUM_FONT,
            fontWeight: 600,
            fontSize: 12,
          },
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              letterSpacing: 2,
              textTransform: "uppercase" as const,
              color: theme.acc,
            },
          },
          group.name,
        ),
        h(
          "div",
          { style: { display: "flex", letterSpacing: 0.5, color: theme.mut } },
          `${wins}–${group.sets.length - wins}`,
        ),
      ),
      ...group.sets.map((set) =>
        buildRow(set, input, theme, t, anyUpset, seedWidth),
      ),
    ];
  });

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        position: "relative" as const,
        paddingLeft: RAIL_W,
        marginTop: 6,
        borderTop: `1px solid ${theme.line}`,
      },
    },
    ...buildRail(nodes, height, input, theme),
    ...sections,
  );
}

export function buildPathGraphic(input: PathGraphicInput): React.ReactElement {
  const { body, palette } = input;
  const theme: Theme = {
    bg: palette.bgGradientEnd,
    text: palette.textPrimary,
    mut: palette.textMuted,
    acc: palette.accent,
    line: "rgba(255,255,255,0.08)",
    foot: palette.textFooter,
  };
  const t = stringsFor(body.locale);
  const contentWidth = pathImageWidth(body) - PAD_X * 2;

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        width: "100%",
        padding: `16px ${PAD_X}px 14px`,
        borderRadius: 12,
        backgroundColor: theme.bg,
        fontFamily: TEXT_FONT,
        fontWeight: 400,
        color: theme.text,
      },
    },
    buildTopLine(input, theme),
    buildHero(input, theme, t),
    buildSeedTrack(body.player, body.numEntrants, contentWidth, theme, t),
    body.sets.length > 0
      ? buildPath(input, theme, t)
      : h(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "center",
              padding: "24px 0 10px",
              fontSize: 12,
              color: theme.mut,
            },
          },
          t.noSets,
        ),
    h(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
          fontSize: 11,
          color: theme.foot,
        },
      },
      h("div", { style: { display: "flex" } }, t.legend),
      h("div", { style: { display: "flex" } }, "smash-ranker.app"),
    ),
  );
}
