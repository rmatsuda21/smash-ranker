import { Design, ElementConfig, LayerDesign, PlayerDesign } from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const PADDING = 30;
const VERT_PADDING = 16;
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

const createPlayerElements = (w: number, h: number): ElementConfig[] => [
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
    size: { width: 2, height: h },
  },
  {
    name: "Character",
    type: "characterImage",
    position: { x: -w * 0.08, y: -h * 0.12 },
    size: { width: w * 1.16, height: h * 1.12 },
    shadowEnabled: false,
    clip: true,
    clipOffset: { top: Math.ceil(h * 0.15), left: Math.ceil(w * 0.15) },
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
    fontSize: 72,
    fontWeight: 900,
    fill: "text",
    stroke: "placementStroke",
    strokeWidth: 3,
    shadowBlur: 8,
    shadowColor: "placementShadow",
    shadowOffset: { x: 3, y: 3 },
    position: { x: 12, y: 8 },
  },
  {
    name: "Prefix",
    type: "smartText",
    text: DesignPlaceholder.PLAYER_PREFIX,
    fontSize: 22,
    fontWeight: 600,
    fill: "prefixText",
    anchor: "bottomLeft",
    position: { x: 14, y: h - 42 },
    size: { width: w - 28, height: 28 },
    conditions: [DesignPlaceholder.PLAYER_PREFIX],
  },
  {
    name: "Tag",
    type: "smartText",
    text: DesignPlaceholder.PLAYER_TAG,
    fontSize: 36,
    fontWeight: 900,
    fill: "text",
    anchor: "bottomLeft",
    position: { x: 14, y: h - 10 },
    size: { width: w - 28, height: 44 },
    conditions: [RenderCondition.NOT, DesignPlaceholder.PLAYER_PREFIX],
  },
  {
    name: "Full Name",
    type: "smartText",
    text: DesignPlaceholder.PLAYER_TAG,
    fontSize: 36,
    fontWeight: 900,
    fill: "text",
    anchor: "bottomLeft",
    position: { x: 14, y: h - 10 },
    size: { width: w - 28, height: 44 },
    conditions: [DesignPlaceholder.PLAYER_PREFIX],
  },
  {
    name: "Alt Characters",
    type: "altCharacterImage",
    position: { x: w - 200, y: h - 84 },
    size: { width: 190, height: 36 },
    rows: 1,
    gap: 4,
    justify: "end",
  },
  {
    name: "Flag",
    type: "playerFlag",
    position: { x: w - 44, y: h - 44 },
    size: { width: 32, height: 32 },
    fillMode: "contain",
    conditions: [DesignPlaceholder.PLAYER_COUNTRY],
  },
];

const basePlayer: PlayerDesign = {
  position: { x: 0, y: 0 },
  size: { width: BASE_CARD_SIZE, height: BASE_CARD_SIZE },
  scale: { x: 1, y: 1 },
  elements: createPlayerElements(BASE_CARD_SIZE, BASE_CARD_SIZE),
};

const getScale = (size: number) => ({
  x: size / BASE_CARD_SIZE,
  y: size / BASE_CARD_SIZE,
});

const players: Partial<PlayerDesign>[] = [
  // 1st place — portrait rectangle
  {
    position: { x: PADDING, y: PLAYER_AREA_Y },
    size: { width: FIRST_PL_WIDTH, height: FIRST_PL_HEIGHT },
    scale: { x: 1, y: 1 },
    elements: createPlayerElements(FIRST_PL_WIDTH, FIRST_PL_HEIGHT),
  },
  // 2nd-4th — top row
  {
    position: { x: RIGHT_X, y: PLAYER_AREA_Y },
    scale: getScale(TOP_ROW_SIZE),
  },
  {
    position: { x: RIGHT_X + TOP_ROW_SIZE + CARD_GAP, y: PLAYER_AREA_Y },
    scale: getScale(TOP_ROW_SIZE),
  },
  {
    position: { x: RIGHT_X + (TOP_ROW_SIZE + CARD_GAP) * 2, y: PLAYER_AREA_Y },
    scale: getScale(TOP_ROW_SIZE),
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
    position: { x: RIGHT_X + (BOTTOM_ROW_SIZE + CARD_GAP) * 2, y: BOTTOM_ROW_Y },
    scale: getScale(BOTTOM_ROW_SIZE),
  },
  {
    position: { x: RIGHT_X + (BOTTOM_ROW_SIZE + CARD_GAP) * 3, y: BOTTOM_ROW_Y },
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
      fontWeight: 900,
      fill: "text",
      position: { x: PADDING, y: VERT_PADDING + TOP_BAR_HEIGHT + 8 },
      size: { width: 1380, height: 80 },
    },
    {
      type: "text",
      id: "dateText",
      name: "Date",
      textId: "dateText",
      fontSize: 28,
      fontWeight: 600,
      fill: "text",
      position: { x: PADDING, y: 108 },
      textTransform: "uppercase",
    },
    {
      type: "smartText",
      id: "locationText",
      name: "Location",
      textId: "locationText",
      fontSize: 28,
      fontWeight: 600,
      fill: "text",
      anchor: "topRight",
      position: { x: CANVAS_WIDTH - PADDING, y: VERT_PADDING + TOP_BAR_HEIGHT + 8 },
      textTransform: "uppercase",
    },
    {
      type: "smartText",
      id: "entrantsText",
      name: "Entrants",
      textId: "entrantsText",
      fontSize: 28,
      fontWeight: 600,
      fill: "text",
      anchor: "topRight",
      position: { x: CANVAS_WIDTH - PADDING, y: VERT_PADDING + TOP_BAR_HEIGHT + 40 },
      textTransform: "uppercase",
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
