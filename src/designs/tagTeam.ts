import {
  Design,
  ElementConfig,
  LayerDesign,
  PlayerDesign,
  Point,
} from "@/types/top8/Design";
import { TeamMember } from "@/types/top8/Player";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

// Doubles. Every card is cut in two by a leaning seam: the player on a
// bright half, their teammate on a dark one, like a tag-team select screen.
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const PAD = 30;
const GAP = 20;
const INNER = CANVAS_WIDTH - 2 * PAD;

const ROW_A_Y = 178;
const ROW_A_HEIGHT = 468;
const ROW_B_Y = ROW_A_Y + ROW_A_HEIGHT + GAP;
const ROW_B_HEIGHT = 300;

const FIRST_WIDTH = 720;
const SECOND_WIDTH = (INNER - FIRST_WIDTH - 2 * GAP) / 2;
const SMALL_WIDTH = (INNER - 4 * GAP) / 5;

const FOOTER_Y = ROW_B_Y + ROW_B_HEIGHT;

/** Width of the gap the seam leaves between the halves. */
const SEAM = 12;
/** How far the seam leans, as a share of the card's height. */
const LEAN = 0.2;

const p = (x: number, y: number): Point => ({ x, y });

const colorPalette: Design["colorPalette"] = {
  ground: { color: "rgb(15, 16, 20)", name: "Ground", group: "Background" },
  texture: {
    color: "rgba(255, 255, 255, 0.05)",
    name: "Texture",
    group: "Background",
  },
  bright: { color: "rgb(246, 196, 40)", name: "Bright Half", group: "Card" },
  dark: { color: "rgb(42, 45, 56)", name: "Dark Half", group: "Card" },
  halftone: {
    color: "rgba(0, 0, 0, 0.16)",
    name: "Halftone",
    group: "Card",
  },
  accent: { color: "rgb(246, 196, 40)", name: "Accent", group: "Text" },
  onAccent: { color: "rgb(15, 16, 20)", name: "On Accent", group: "Text" },
  text: { color: "rgb(255, 255, 255)", name: "Text", group: "Text" },
  muted: { color: "rgb(178, 182, 196)", name: "Details", group: "Text" },
};

/**
 * @param w card width
 * @param h card height
 * @param s scale of the lettering and icons
 */
const createPlayerElements = (
  w: number,
  h: number,
  s: number,
): ElementConfig[] => {
  const lean = h * LEAN;
  // The seam's centre line runs from (topX, 0) to (bottomX, h).
  const topX = w / 2 + lean / 2;
  const bottomX = w / 2 - lean / 2;
  const half = SEAM / 2;

  const leftHalf: Point[] = [
    p(0, 0),
    p(topX - half, 0),
    p(bottomX - half, h),
    p(0, h),
  ];
  const rightHalf: Point[] = [
    p(topX + half, 0),
    p(w, 0),
    p(w, h),
    p(bottomX + half, h),
  ];

  // The art's box: taller than the card so shoulders run off the bottom,
  // centred on its own half.
  const artWidth = Math.max(w * 0.6, h * 0.95);
  const artHeight = h * 1.08;
  const artY = h * 0.02;

  const side = (
    member: TeamMember,
    clipPoints: Point[],
    fill: string,
    centreX: number,
  ): ElementConfig => ({
    type: "group",
    id: `${member}Half`,
    position: p(0, 0),
    size: { width: w, height: h },
    clipPoints,
    elements: [
      { type: "rect", fill, position: p(0, 0), size: { width: w, height: h } },
      {
        type: "pattern",
        pattern: "dots",
        color: "halftone",
        spacing: 14,
        weight: 3,
        angle: 30,
        position: p(0, 0),
        size: { width: w, height: h },
      },
      {
        type: "characterImage",
        member,
        shadowEnabled: false,
        position: p(centreX - artWidth / 2, artY),
        size: { width: artWidth, height: artHeight },
      },
    ],
  });

  const nameWidth = w / 2 - 22 * s - half;
  const prefixSize = Math.round(18 * s);
  const tagSize = Math.round(34 * s);
  const tagHeight = Math.round(42 * s);
  const tagBottom = h - Math.round(12 * s);
  const prefixBottom = tagBottom - tagHeight - Math.round(1 * s);
  const flagSize = { width: Math.round(30 * s), height: Math.round(22 * s) };
  const iconSize = Math.round(34 * s);

  const names = (member: TeamMember): ElementConfig[] => {
    const right = member === "teammate";
    const x = right ? w - Math.round(16 * s) : Math.round(16 * s);
    const anchor = right ? "bottomRight" : "bottomLeft";
    const align = right ? "right" : "left";
    const prefix = right
      ? DesignPlaceholder.TEAMMATE_PREFIX
      : DesignPlaceholder.PLAYER_PREFIX;

    return [
      {
        type: "smartText",
        id: `${member}Prefix`,
        text: prefix,
        conditions: [prefix],
        textTransform: "uppercase",
        fontSize: prefixSize,
        fontWeight: 400,
        letterSpacing: 1,
        fill: "accent",
        anchor,
        align,
        position: p(x, prefixBottom),
        size: { width: nameWidth, height: Math.round(24 * s) },
      },
      {
        type: "smartText",
        id: `${member}Tag`,
        text: right
          ? DesignPlaceholder.TEAMMATE_TAG
          : DesignPlaceholder.PLAYER_TAG,
        fontSize: tagSize,
        fontWeight: 400,
        fill: "text",
        anchor,
        align,
        verticalAlign: "middle",
        position: p(x, tagBottom),
        size: { width: nameWidth, height: tagHeight },
      },
    ];
  };

  const tabWidth = Math.round(104 * s);
  const tabHeight = Math.round(96 * s);

  return [
    side("player", leftHalf, "bright", bottomX / 2 + w * 0.03),
    side("teammate", rightHalf, "dark", (topX + w) / 2 - w * 0.03),
    {
      name: "Name Shade",
      type: "rect",
      fill: {
        type: "linear",
        angle: 180,
        colorStops: [
          { position: 0, color: "rgba(15, 16, 20, 0)" },
          { position: 0.55, color: "rgba(15, 16, 20, 0.8)" },
          { position: 1, color: "rgba(15, 16, 20, 0.94)" },
        ],
      },
      position: p(0, h - Math.round(140 * s)),
      size: { width: w, height: Math.round(140 * s) },
    },
    {
      name: "Placement Tab",
      type: "polygon",
      fill: "ground",
      points: [
        p(0, 0),
        p(tabWidth, 0),
        p(tabWidth - tabHeight * LEAN, tabHeight),
        p(0, tabHeight),
      ],
      position: p(0, 0),
    },
    {
      name: "Placement",
      type: "smartText",
      text: DesignPlaceholder.PLAYER_PLACEMENT,
      fontSize: Math.round(72 * s),
      fontWeight: 400,
      fill: "accent",
      align: "center",
      verticalAlign: "middle",
      position: p(0, 0),
      size: {
        width: tabWidth - (tabHeight * LEAN) / 2,
        height: tabHeight,
      },
    },
    {
      name: "Player Flag",
      type: "playerFlag",
      conditions: [DesignPlaceholder.PLAYER_COUNTRY],
      position: p(tabWidth + Math.round(8 * s), Math.round(12 * s)),
      size: flagSize,
      fillMode: "contain",
      align: "left",
    },
    {
      name: "Teammate Flag",
      type: "playerFlag",
      member: "teammate",
      conditions: [DesignPlaceholder.TEAMMATE_COUNTRY],
      position: p(w - Math.round(12 * s) - flagSize.width, Math.round(12 * s)),
      size: flagSize,
      fillMode: "contain",
      align: "right",
    },
    {
      name: "Player Characters",
      type: "customAltCharacterImage",
      position: p(Math.round(12 * s), tabHeight + Math.round(10 * s)),
      size: { width: iconSize, height: h * 0.4 },
      columns: 1,
      gap: Math.round(4 * s),
      elementTemplate: {
        type: "characterImage",
        position: p(0, 0),
        size: { width: iconSize, height: iconSize },
      },
    },
    {
      name: "Teammate Characters",
      type: "customAltCharacterImage",
      member: "teammate",
      position: p(
        w - Math.round(12 * s) - iconSize,
        Math.round(22 * s) + flagSize.height,
      ),
      size: { width: iconSize, height: h * 0.4 },
      columns: 1,
      gap: Math.round(4 * s),
      elementTemplate: {
        type: "characterImage",
        position: p(0, 0),
        size: { width: iconSize, height: iconSize },
      },
    },
    ...names("player"),
    ...names("teammate"),
  ];
};

const slot = (
  x: number,
  y: number,
  w: number,
  h: number,
  s: number,
): PlayerDesign => ({
  position: p(x, y),
  size: { width: w, height: h },
  scale: { x: 1, y: 1 },
  elements: createPlayerElements(w, h, s),
});

const SMALL_SCALE = 0.86;

const basePlayer = slot(0, 0, SMALL_WIDTH, ROW_B_HEIGHT, SMALL_SCALE);

const players: Partial<PlayerDesign>[] = [
  slot(PAD, ROW_A_Y, FIRST_WIDTH, ROW_A_HEIGHT, 1.5),
  slot(PAD + FIRST_WIDTH + GAP, ROW_A_Y, SECOND_WIDTH, ROW_A_HEIGHT, 1.2),
  slot(
    PAD + FIRST_WIDTH + SECOND_WIDTH + 2 * GAP,
    ROW_A_Y,
    SECOND_WIDTH,
    ROW_A_HEIGHT,
    1.2,
  ),
  ...Array.from({ length: 5 }, (_, index) => ({
    position: p(PAD + index * (SMALL_WIDTH + GAP), ROW_B_Y),
  })),
];

const background: LayerDesign = {
  elements: [
    {
      type: "rect",
      fill: "ground",
      position: p(0, 0),
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    },
    {
      type: "pattern",
      pattern: "lines",
      color: "texture",
      spacing: 26,
      weight: 10,
      angle: 102,
      position: p(0, 0),
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    },
    {
      id: "backgroundImage",
      type: "backgroundImage",
      conditions: [RenderCondition.BACKGROUND_IMG],
      position: p(0, 0),
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      fillMode: "cover",
    },
  ],
};

const ICON_SIZE = 78;
const FOOTER_MIDDLE = FOOTER_Y + (CANVAS_HEIGHT - FOOTER_Y) / 2;

const tournament: LayerDesign = {
  elements: [
    {
      type: "smartText",
      id: "eventText",
      name: "Event",
      textId: "eventText",
      textTransform: "uppercase",
      fontSize: 26,
      fontWeight: 400,
      letterSpacing: 3,
      fill: "onAccent",
      background: {
        fill: "accent",
        padding: { top: 5, right: 14, bottom: 5, left: 14 },
      },
      position: p(PAD + 14, 34),
      size: { width: 700, height: 32 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "titleText",
      name: "Title",
      textId: "titleText",
      fontSize: 72,
      fontWeight: 400,
      fill: "text",
      verticalAlign: "middle",
      position: p(PAD, 76),
      size: { width: 1280, height: 88 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "dateText",
      name: "Date",
      textId: "dateText",
      textTransform: "uppercase",
      fontSize: 28,
      fontWeight: 400,
      letterSpacing: 2,
      fill: "text",
      anchor: "topRight",
      align: "right",
      position: p(CANVAS_WIDTH - PAD, 40),
      size: { width: 520, height: 34 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "locationText",
      name: "Location",
      textId: "locationText",
      textTransform: "uppercase",
      fontSize: 24,
      fontWeight: 400,
      letterSpacing: 2,
      fill: "muted",
      anchor: "topRight",
      align: "right",
      position: p(CANVAS_WIDTH - PAD, 82),
      size: { width: 520, height: 30 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "entrantsText",
      name: "Entrants",
      textId: "entrantsText",
      textTransform: "uppercase",
      fontSize: 24,
      fontWeight: 400,
      letterSpacing: 2,
      fill: "accent",
      anchor: "topRight",
      align: "right",
      position: p(CANVAS_WIDTH - PAD, 120),
      size: { width: 520, height: 30 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "urlText",
      name: "URL",
      textId: "urlText",
      fontSize: 24,
      fontWeight: 400,
      fill: "muted",
      anchor: "leftMiddle",
      position: p(PAD, FOOTER_MIDDLE),
      size: { width: 1200, height: 32 },
      selectable: true,
    },
    {
      type: "tournamentIcon",
      id: "tournamentIcon",
      name: "Tournament Icon",
      conditions: [RenderCondition.TOURNAMENT_ICON],
      position: p(
        CANVAS_WIDTH - PAD - ICON_SIZE,
        FOOTER_MIDDLE - ICON_SIZE / 2,
      ),
      size: { width: ICON_SIZE, height: ICON_SIZE },
      fillMode: "contain",
    },
  ],
};

export const tagTeamDesign: Design = {
  name: "Tag Team",
  doubles: true,
  canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasDisplayScale: 0.5,
  colorPalette,
  textPalette: {
    eventText: { text: DesignPlaceholder.EVENT_NAME, name: "Event" },
    titleText: { text: DesignPlaceholder.TOURNAMENT_NAME, name: "Title" },
    dateText: { text: DesignPlaceholder.TOURNAMENT_DATE, name: "Date" },
    locationText: {
      text: `${DesignPlaceholder.TOURNAMENT_CITY}, ${DesignPlaceholder.TOURNAMENT_COUNTRY}`,
      name: "Location",
    },
    entrantsText: {
      text: `${DesignPlaceholder.ENTRANTS} Teams`,
      name: "Entrants",
    },
    urlText: { text: DesignPlaceholder.TOURNAMENT_URL, name: "URL" },
  },
  background,
  tournament,
  basePlayer,
  players,
};
