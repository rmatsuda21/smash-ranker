import { Design, LayerDesign, PlayerDesign } from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const INLINE_PADDING = 74;
const TWIITER_HEIGHT = 55;
const BASE_PL_SIZE = 700;
const MAIN_PL_SIZE = 639;
const PLAYER_SPACING = 20;
const TOP_ROW_SIZE = 355;
const BOTTOM_ROW_SIZE = 261;
const MAIN_PL_X = INLINE_PADDING;
const MAIN_PL_Y = 190;

const TOURNAMENT_ICON_SIZE = 140;
const SMASH_BALL_SIZE = 1600;

const basePlayer: PlayerDesign = {
  position: { x: 25, y: 190 },
  size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
  scale: { x: 1, y: 1 },
  elements: [
    {
      name: "Twitter",
      type: "group",
      position: { x: 0, y: BASE_PL_SIZE + 10 },
      size: { width: BASE_PL_SIZE, height: TWIITER_HEIGHT },
      conditions: [DesignPlaceholder.PLAYER_TWITTER],
      align: "center",
      elements: [
        {
          type: "rect",
          fill: "primary",
          position: { x: 0, y: 0 },
          size: { width: BASE_PL_SIZE, height: TWIITER_HEIGHT },
        },
        {
          type: "text",
          text: "𝕏",
          fontSize: 50,
          align: "left",
          verticalAlign: "top",
          fontWeight: 900,
          fill: "text",
          position: { x: 10, y: -5 },
          size: { width: BASE_PL_SIZE, height: 40 },
        },
        {
          type: "smartText",
          conditions: [DesignPlaceholder.PLAYER_TWITTER],
          text: `@${DesignPlaceholder.PLAYER_TWITTER}`,
          fontSize: 40,
          align: "center",
          verticalAlign: "middle",
          fontWeight: 600,
          fill: "text",
          position: { x: 50, y: 0 },
          size: { width: BASE_PL_SIZE - 50, height: TWIITER_HEIGHT - 10 },
        },
      ],
    },
    {
      name: "No Twitter",
      id: "no-twitter",
      type: "rect",
      fill: "#00000055",
      position: { x: 0, y: BASE_PL_SIZE + 10 },
      size: { width: BASE_PL_SIZE, height: TWIITER_HEIGHT },
      conditions: [RenderCondition.NOT, DesignPlaceholder.PLAYER_TWITTER],
      filterEffects: [{ type: "Grayscale" }],
    },
    {
      name: "Background",
      id: "player-bg",
      type: "rect",
      fill: "playerBackground",
      position: { x: 0, y: 0 },
      size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
    },
    {
      name: "Character",
      type: "characterImage",
      position: { x: 0, y: 0 },
      size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
      clip: true,
      shadowBlur: 2,
      shadowColor: "characterShadow",
    },
    {
      name: "Frame",
      type: "svg",
      src: "/assets/top8/theme/mini/frame.svg",
      position: { x: 0, y: 0 },
      size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
      palette: {
        color_1: "primary",
      },
    },
    {
      name: "Alt Characters",
      type: "altCharacterImage",
      position: { x: 555, y: 30 },
      justify: "end",
      size: { width: 105, height: BASE_PL_SIZE - 150 },
    },
    {
      name: "Full Name",
      type: "smartText",
      text: `${DesignPlaceholder.PLAYER_PREFIX} | ${DesignPlaceholder.PLAYER_TAG}`,
      fontSize: 140,
      fontWeight: 900,
      align: "center",
      anchor: "bottomLeft",
      size: { width: BASE_PL_SIZE, height: 150 },
      position: { x: 0, y: BASE_PL_SIZE - 20 },
      fill: "text",
      shadowColor: "textShadow",
      shadowOffset: { x: 10, y: 10 },
      verticalAlign: "bottom",
      conditions: [DesignPlaceholder.PLAYER_PREFIX],
    },
    {
      name: "Tag",
      type: "smartText",
      text: DesignPlaceholder.PLAYER_TAG,
      fontSize: 140,
      fontWeight: 900,
      align: "center",
      anchor: "bottomLeft",
      size: { width: BASE_PL_SIZE, height: 150 },
      position: { x: 0, y: BASE_PL_SIZE - 20 },
      fill: "text",
      shadowColor: "textShadow",
      verticalAlign: "bottom",
      shadowOffset: { x: 10, y: 10 },
      conditions: [RenderCondition.NOT, DesignPlaceholder.PLAYER_PREFIX],
    },
    {
      name: "Placement",
      type: "text",
      text: DesignPlaceholder.PLAYER_PLACEMENT,
      fontSize: 150,
      fontWeight: 900,
      fill: "text",
      position: { x: 45, y: 20 },
      shadowBlur: 15,
      shadowColor: "placementShadow",
    },
    {
      type: "playerFlag",
      position: { x: 40, y: 185 },
      size: { width: 100, height: 100 },
      fillMode: "contain",
    },
  ],
};

const getScale = (size: number) => ({
  x: size / BASE_PL_SIZE,
  y: size / BASE_PL_SIZE,
});

const firstRow = [
  {
    position: {
      x: MAIN_PL_X + MAIN_PL_SIZE + PLAYER_SPACING,
      y: MAIN_PL_Y,
    },
    scale: getScale(TOP_ROW_SIZE),
  },
  {
    position: {
      x: MAIN_PL_X + MAIN_PL_SIZE + PLAYER_SPACING * 2 + TOP_ROW_SIZE,
      y: MAIN_PL_Y,
    },
    scale: getScale(TOP_ROW_SIZE),
  },
  {
    position: {
      x: MAIN_PL_X + MAIN_PL_SIZE + PLAYER_SPACING * 3 + TOP_ROW_SIZE * 2,
      y: MAIN_PL_Y,
    },
    scale: getScale(TOP_ROW_SIZE),
  },
];

const secondRow = [
  {
    position: {
      x: MAIN_PL_X + MAIN_PL_SIZE + PLAYER_SPACING,
      y: 603,
    },
    scale: getScale(BOTTOM_ROW_SIZE),
  },
  {
    position: {
      x: MAIN_PL_X + MAIN_PL_SIZE + PLAYER_SPACING * 2 + BOTTOM_ROW_SIZE,
      y: 603,
    },
    scale: getScale(BOTTOM_ROW_SIZE),
  },
  {
    position: {
      x: MAIN_PL_X + MAIN_PL_SIZE + PLAYER_SPACING * 3 + BOTTOM_ROW_SIZE * 2,
      y: 603,
    },
    scale: getScale(BOTTOM_ROW_SIZE),
  },
  {
    position: {
      x: MAIN_PL_X + MAIN_PL_SIZE + PLAYER_SPACING * 4 + BOTTOM_ROW_SIZE * 3,
      y: 603,
    },
    scale: getScale(BOTTOM_ROW_SIZE),
  },
];

const players: Partial<PlayerDesign>[] = [
  {
    position: {
      x: MAIN_PL_X,
      y: MAIN_PL_Y,
    },
    scale: getScale(MAIN_PL_SIZE),
  },
  {
    ...firstRow[0],
  },
  {
    ...firstRow[1],
  },
  {
    ...firstRow[2],
  },
  {
    ...secondRow[0],
  },
  {
    ...secondRow[1],
  },
  {
    ...secondRow[2],
  },
  {
    ...secondRow[3],
  },
];

const colorPalette: Design["colorPalette"] = {
  primary: { color: "rgb(179, 0, 0)", name: "Primary" },
  secondary: { color: "rgb(235, 171, 64)", name: "Secondary" },
  background: { color: "rgb(0, 0, 0)", name: "Background" },
  text: { color: "rgb(255, 255, 255)", name: "Text" },
  // textStroke: { color: "rgb(0, 0, 0)", name: "Text Stroke" },
  textShadow: { color: "rgb(0, 0, 0)", name: "Text Shadow" },
  placementShadow: { color: "rgb(255, 255, 255)", name: "Placement Shadow" },
  playerBackground: { color: "rgb(0, 0, 0)", name: "Player Background" },
  characterShadow: { color: "rgb(255, 0, 0)", name: "Character Shadow" },
  smashBall: { color: "rgba(255, 255, 255, 0.2)", name: "Smash Ball" },
};

const background: LayerDesign = {
  elements: [
    {
      type: "rect",
      fill: "background",
      position: { x: 0, y: 0 },
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    },
    {
      id: "smashBall",
      type: "svg",
      src: "/assets/top8/theme/mini/smash_ball.svg",
      position: {
        x: (CANVAS_WIDTH - SMASH_BALL_SIZE) / 2 + 510,
        y: (CANVAS_HEIGHT - SMASH_BALL_SIZE) / 2 - 200,
      },
      size: { width: SMASH_BALL_SIZE, height: SMASH_BALL_SIZE },
      palette: {
        color_1: "smashBall",
      },
    },
    {
      id: "backgroundImage",
      type: "backgroundImage",
      conditions: [RenderCondition.BACKGROUND_IMG],
      position: { x: 0, y: 0 },
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      fillMode: "cover",
    },
    {
      id: "bg",
      type: "svg",
      src: "/assets/top8/theme/mini/bg_frame.svg",
      position: { x: 0, y: 0 },
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      palette: {
        color_1: "secondary",
        color_2: "primary",
      },
    },
    {
      id: "creatorText",
      type: "smartText",
      textId: "creatorText",
      text: "Design by @Elenriqu3",
      fontSize: 25,
      fontWeight: 900,
      fill: "text",
      anchor: "bottomRight",
      position: {
        x: CANVAS_WIDTH - INLINE_PADDING - 10,
        y: CANVAS_HEIGHT - INLINE_PADDING,
      },
    },
  ],
};

const tournament: LayerDesign = {
  elements: [
    {
      type: "flexGroup",
      id: "tournamentInfoGroup",
      position: { x: INLINE_PADDING, y: 25 },
      size: {
        width: CANVAS_WIDTH - INLINE_PADDING * 2 - TOURNAMENT_ICON_SIZE,
        height: TOURNAMENT_ICON_SIZE,
      },
      direction: "row",
      align: "center",
      gap: 10,
      elements: [
        {
          type: "tournamentIcon",
          id: "tournamentIcon",
          name: "Tournament Icon",
          position: { x: 0, y: 0 },
          size: { width: TOURNAMENT_ICON_SIZE, height: TOURNAMENT_ICON_SIZE },
          conditions: [RenderCondition.TOURNAMENT_ICON],
          fillMode: "contain",
          align: "top",
        },
        {
          type: "text",
          id: "topLeftText",
          name: "Top Left Text",
          position: { x: 0, y: 0 },
          textId: "topLeftText",
          fontSize: 40,
          fontWeight: 900,
          fill: "text",
          selectable: true,
        },
      ],
    },
    {
      type: "smartText",
      id: "topRightText",
      name: "Top Right Text",
      position: {
        x: CANVAS_WIDTH - INLINE_PADDING - 10,
        y: INLINE_PADDING + 10,
      },
      textId: "topRightText",
      fontSize: 20,
      fontWeight: 900,
      fill: "text",
      anchor: "topRight",
      selectable: true,
    },
    {
      type: "text",
      id: "bottomText",
      name: "Bottom Text",
      position: { x: INLINE_PADDING, y: CANVAS_HEIGHT - INLINE_PADDING - 40 },
      textId: "bottomText",
      fontSize: 40,
      fontWeight: 900,
      fill: "text",
      selectable: true,
    },
  ],
};

export const top8erDesign: Design = {
  name: "Top8er",
  author: "@Elenriqu3",
  canvasSize: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  canvasDisplayScale: 0.5,
  colorPalette,
  textPalette: {
    topLeftText: {
      text: `${DesignPlaceholder.TOURNAMENT_NAME} - ${DesignPlaceholder.EVENT_NAME}`,
      name: "Top Left Text",
    },
    topRightText: {
      text: DesignPlaceholder.TOURNAMENT_URL,
      name: "Top Right Text",
    },
    bottomText: {
      text: `${DesignPlaceholder.TOURNAMENT_DATE} - ${DesignPlaceholder.TOURNAMENT_LOCATION} - ${DesignPlaceholder.ENTRANTS} Entrants`,
      name: "Bottom Text",
    },
  },
  background,
  tournament,
  basePlayer,
  players,
};
