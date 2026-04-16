import {
  Design,
  ElementConfig,
  LayerDesign,
  PlayerDesign,
} from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const PADDING = 30;
const VERT_PADDING = 32;
const CARD_GAP = 20;
const TOP_BAR_HEIGHT = 4;
const PLAYER_AREA_Y = 168;
const FOOTER_BOTTOM = CANVAS_HEIGHT - VERT_PADDING;

const FIRST_PL_WIDTH = 490;
const TOP_ROW_SIZE = 436;
const BOTTOM_ROW_SIZE = 322;
const FIRST_PL_HEIGHT = TOP_ROW_SIZE + CARD_GAP + BOTTOM_ROW_SIZE;

const BASE_CARD_SIZE = TOP_ROW_SIZE;

const RIGHT_X = PADDING + FIRST_PL_WIDTH + CARD_GAP;
const BOTTOM_ROW_Y = PLAYER_AREA_Y + TOP_ROW_SIZE + CARD_GAP;

const TOURNAMENT_ICON_SIZE = 90;

// Element scale per placement tier — tweak these to adjust UI element sizes
const FIRST_ELEMENT_SCALE = 1.3;
const TOP_ELEMENT_SCALE = 1.15;
const BOTTOM_ELEMENT_SCALE = 1.0;

/**
 * @param s — UI element scale factor (affects text, icons, not card/character)
 * @param clipGap — overflow distance in local coords (accounts for group scale)
 * @param noLeftClip — if true, extend left clip generously (for edge cards)
 * @param noTopClip — if true, extend top clip generously (for top-row cards)
 */
const createPlayerElements = (
  w: number,
  h: number,
  s: number = 1,
  clipGap: number = CARD_GAP,
  noLeftClip: boolean = false,
  noTopClip: boolean = false,
): ElementConfig[] => [
  {
    name: "Card Background",
    type: "rect",
    fill: "cardBg",
    position: { x: 0, y: 0 },
    size: { width: w, height: h },
  },
  {
    name: "Left Border",
    type: "rect",
    fill: "leftBorder",
    position: { x: 0, y: 0 },
    size: { width: 5, height: h },
  },
  {
    name: "Character",
    type: "characterImage",
    position: { x: -w * 0.08, y: -h * 0.12 },
    size: { width: w * 1.16, height: h * 1.12 },
    shadowEnabled: false,
    clip: true,
    clipOffset: {
      top: noTopClip ? Math.ceil(h * 0.2) : clipGap,
      left: noLeftClip ? Math.ceil(w * 0.2) : clipGap,
    },
  },
  {
    name: "Bottom Gradient",
    type: "rect",
    fill: {
      type: "linear",
      angle: 180,
      colorStops: [
        { position: 0, color: "rgba(0, 0, 0, 0)" },
        { position: 1, color: "rgba(0, 0, 0, 0.85)" },
      ],
    },
    position: { x: 0, y: h * 0.75 },
    size: { width: w, height: h * 0.25 },
  },
  {
    name: "Placement",
    type: "text",
    text: DesignPlaceholder.PLAYER_PLACEMENT,
    fontSize: Math.round(80 * s),
    fontWeight: 500,
    fill: "text",
    stroke: "placementStroke",
    strokeWidth: Math.round(2 * s),
    shadowBlur: Math.round(8 * s),
    shadowColor: "placementShadow",
    shadowOffset: { x: Math.round(3 * s), y: Math.round(3 * s) },
    position: { x: Math.round(15 * s), y: Math.round(8 * s) },
  },
  {
    name: "Prefix",
    type: "smartText",
    text: DesignPlaceholder.PLAYER_PREFIX,
    fontSize: Math.round(20 * s),
    fontWeight: 400,
    fill: "prefixText",
    anchor: "bottomLeft",
    position: { x: Math.round(14 * s), y: h - Math.round(42 * s) },
    size: { width: w - Math.round(28 * s), height: Math.round(28 * s) },
    conditions: [DesignPlaceholder.PLAYER_PREFIX],
  },
  {
    name: "Tag",
    type: "smartText",
    text: DesignPlaceholder.PLAYER_TAG,
    fontSize: Math.round(40 * s),
    fontWeight: 500,
    fill: "text",
    anchor: "bottomLeft",
    position: { x: Math.round(14 * s), y: h - Math.round(10 * s) },
    size: { width: w - Math.round(28 * s), height: Math.round(44 * s) },
  },
  {
    name: "Alt Characters",
    type: "altCharacterImage",
    position: { x: w - Math.round(280 * s), y: Math.round(12 * s) },
    size: { width: Math.round(268 * s), height: Math.round(268 * s) },
    rows: 6,
    gap: Math.round(4 * s),
    flow: "column",
    align: "start",
    justify: "end",
    alignLastRow: "start",
  },
  {
    name: "Flag",
    type: "playerFlag",
    position: { x: w - Math.round(44 * s), y: h - Math.round(44 * s) },
    size: { width: Math.round(32 * s), height: Math.round(32 * s) },
    fillMode: "contain",
    conditions: [DesignPlaceholder.PLAYER_COUNTRY],
  },
];

// Bottom row local gap: CARD_GAP / (BOTTOM_ROW_SIZE / BASE_CARD_SIZE)
const BOTTOM_LOCAL_GAP = Math.ceil(
  (CARD_GAP * BASE_CARD_SIZE) / BOTTOM_ROW_SIZE,
);

const basePlayer: PlayerDesign = {
  position: { x: 0, y: 0 },
  size: { width: BASE_CARD_SIZE, height: BASE_CARD_SIZE },
  scale: { x: 1, y: 1 },
  elements: createPlayerElements(
    BASE_CARD_SIZE,
    BASE_CARD_SIZE,
    BOTTOM_ELEMENT_SCALE,
    BOTTOM_LOCAL_GAP,
  ),
};

const getScale = (size: number) => ({
  x: size / BASE_CARD_SIZE,
  y: size / BASE_CARD_SIZE,
});

const topRowElements = createPlayerElements(
  BASE_CARD_SIZE,
  BASE_CARD_SIZE,
  TOP_ELEMENT_SCALE,
  CARD_GAP,
  false,
  true,
);

const players: Partial<PlayerDesign>[] = [
  // 1st place — portrait rectangle
  {
    position: { x: PADDING, y: PLAYER_AREA_Y },
    size: { width: FIRST_PL_WIDTH, height: FIRST_PL_HEIGHT },
    scale: { x: 1, y: 1 },
    elements: createPlayerElements(
      FIRST_PL_WIDTH,
      FIRST_PL_HEIGHT,
      FIRST_ELEMENT_SCALE,
      CARD_GAP,
      true,
      true,
    ),
  },
  // 2nd-4th — top row
  {
    position: { x: RIGHT_X, y: PLAYER_AREA_Y },
    scale: getScale(TOP_ROW_SIZE),
    elements: topRowElements,
  },
  {
    position: { x: RIGHT_X + TOP_ROW_SIZE + CARD_GAP, y: PLAYER_AREA_Y },
    scale: getScale(TOP_ROW_SIZE),
    elements: topRowElements,
  },
  {
    position: { x: RIGHT_X + (TOP_ROW_SIZE + CARD_GAP) * 2, y: PLAYER_AREA_Y },
    scale: getScale(TOP_ROW_SIZE),
    elements: topRowElements,
  },
  // 5th-8th — bottom row
  {
    position: { x: RIGHT_X, y: BOTTOM_ROW_Y },
    scale: getScale(BOTTOM_ROW_SIZE),
  },
  {
    position: { x: RIGHT_X + BOTTOM_ROW_SIZE + CARD_GAP, y: BOTTOM_ROW_Y },
    scale: getScale(BOTTOM_ROW_SIZE),
  },
  {
    position: {
      x: RIGHT_X + (BOTTOM_ROW_SIZE + CARD_GAP) * 2,
      y: BOTTOM_ROW_Y,
    },
    scale: getScale(BOTTOM_ROW_SIZE),
  },
  {
    position: {
      x: RIGHT_X + (BOTTOM_ROW_SIZE + CARD_GAP) * 3,
      y: BOTTOM_ROW_Y,
    },
    scale: getScale(BOTTOM_ROW_SIZE),
  },
];

const colorPalette: Design["colorPalette"] = {
  bgGradient1: { color: "#000000", name: "Background Dark" },
  bgGradient2: { color: "#4B0D0D", name: "Background Red" },
  bgGradient3: { color: "#414141", name: "Background Gray" },
  cardBg: { color: "rgba(80, 50, 50, 0.4)", name: "Card Background" },
  text: { color: "#FFFFFF", name: "Text" },
  prefixText: { color: "rgba(180, 180, 180, 1)", name: "Prefix Text" },
  placementStroke: { color: "#000000", name: "Placement Stroke" },
  placementShadow: { color: "rgba(0, 0, 0, 0.8)", name: "Placement Shadow" },
  leftBorder: { color: "#FFFFFF", name: "Left Border" },
  topBar: { color: "#FFFFFF", name: "Top Bar" },
};

const background: LayerDesign = {
  elements: [
    {
      type: "rect",
      fill: {
        type: "angular",
        colorStops: [
          { position: 0, color: "bgGradient2" },
          { position: 0.24, color: "bgGradient1" },
          { position: 0.42, color: "bgGradient2" },
          { position: 0.73, color: "bgGradient3" },
          { position: 1.0, color: "bgGradient2" },
        ],
      },
      position: { x: 0, y: 0 },
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    },
    {
      name: "Top Bar",
      type: "rect",
      fill: "topBar",
      position: { x: PADDING, y: VERT_PADDING },
      size: { width: CANVAS_WIDTH - PADDING * 2, height: TOP_BAR_HEIGHT },
    },
    {
      id: "backgroundImage",
      type: "backgroundImage",
      conditions: [RenderCondition.BACKGROUND_IMG],
      position: { x: 0, y: 0 },
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      fillMode: "cover",
    },
  ],
};

const tournament: LayerDesign = {
  elements: [
    {
      type: "smartText",
      id: "titleText",
      name: "Title",
      textId: "titleText",
      fontSize: 70,
      fontWeight: 500,
      fill: "text",
      position: { x: PADDING, y: VERT_PADDING + TOP_BAR_HEIGHT + 8 },
      size: { width: 1380, height: 80 },
      selectable: true,
    },
    {
      type: "text",
      id: "dateText",
      name: "Date",
      textId: "dateText",
      fontSize: 28,
      fontWeight: 500,
      fill: "text",
      position: { x: PADDING, y: VERT_PADDING + TOP_BAR_HEIGHT + 80 },
      textTransform: "uppercase",
      selectable: true,
    },
    {
      type: "smartText",
      id: "locationText",
      name: "Location",
      textId: "locationText",
      fontSize: 28,
      fontWeight: 500,
      fill: "text",
      anchor: "topRight",
      position: {
        x: CANVAS_WIDTH - PADDING,
        y: VERT_PADDING + TOP_BAR_HEIGHT + 8,
      },
      textTransform: "uppercase",
      selectable: true,
    },
    {
      type: "smartText",
      id: "entrantsText",
      name: "Entrants",
      textId: "entrantsText",
      fontSize: 28,
      fontWeight: 500,
      fill: "text",
      anchor: "topRight",
      position: {
        x: CANVAS_WIDTH - PADDING,
        y: VERT_PADDING + TOP_BAR_HEIGHT + 40,
      },
      textTransform: "uppercase",
      selectable: true,
    },
    {
      type: "smartText",
      id: "urlText",
      name: "URL",
      textId: "urlText",
      fontSize: 22,
      fontWeight: 400,
      fill: "text",
      anchor: "leftMiddle",
      position: { x: PADDING, y: FOOTER_BOTTOM - TOURNAMENT_ICON_SIZE / 2 },
      selectable: true,
    },
    {
      type: "tournamentIcon",
      id: "tournamentIcon",
      name: "Tournament Icon",
      conditions: [RenderCondition.TOURNAMENT_ICON],
      position: {
        x: CANVAS_WIDTH - PADDING - TOURNAMENT_ICON_SIZE,
        y: FOOTER_BOTTOM - TOURNAMENT_ICON_SIZE,
      },
      size: { width: TOURNAMENT_ICON_SIZE, height: TOURNAMENT_ICON_SIZE },
      fillMode: "contain",
    },
  ],
};

export const kagaribiDesign: Design = {
  name: "Kagaribi",
  canvasSize: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  canvasDisplayScale: 0.5,
  colorPalette,
  textPalette: {
    titleText: {
      text: DesignPlaceholder.TOURNAMENT_NAME,
      name: "Title",
    },
    dateText: {
      text: DesignPlaceholder.TOURNAMENT_DATE,
      name: "Date",
    },
    locationText: {
      text: `@${DesignPlaceholder.TOURNAMENT_STATE}, ${DesignPlaceholder.TOURNAMENT_COUNTRY}`,
      name: "Location",
    },
    entrantsText: {
      text: `${DesignPlaceholder.ENTRANTS} PLAYERS`,
      name: "Entrants",
    },
    urlText: {
      text: DesignPlaceholder.TOURNAMENT_URL,
      name: "URL",
    },
  },
  background,
  tournament,
  basePlayer,
  players,
  reversePlayerZOrder: true,
};
