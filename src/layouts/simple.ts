import { LayoutConfig, PlayerLayoutConfig } from "@/types/top8/LayoutTypes";
import { LayoutPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

const PADDING = 40;
const PLAYER_SPACING = 15;
const BASE_PL_SIZE = 700;
const MAIN_PL_SIZE = 665;
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const SECOND_ROW_Y_OFFSET = 27;

const SMASH_BALL_SIZE = 1600;

const basePlayer: PlayerLayoutConfig = {
  position: { x: 25, y: 190 },
  size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
  scale: { x: 1, y: 1 },
  elements: [
    {
      name: "Twitter",
      type: "group",
      position: { x: 0, y: BASE_PL_SIZE + 10 },
      size: { width: BASE_PL_SIZE, height: 50 },
      elements: [
        {
          type: "rect",
          fill: "primary",
          position: { x: 0, y: 0 },
          size: { width: BASE_PL_SIZE, height: 40 },
        },
        {
          type: "text",
          text: "𝕏",
          fontSize: 40,
          align: "left",
          verticalAlign: "top",
          fontWeight: 900,
          fill: "#ffffff",
          position: { x: 10, y: -5 },
          size: { width: BASE_PL_SIZE, height: 40 },
        },
        {
          type: "text",
          conditions: [LayoutPlaceholder.PLAYER_TWITTER],
          text: `@${LayoutPlaceholder.PLAYER_TWITTER}`,
          fontSize: 30,
          align: "center",
          verticalAlign: "middle",
          fontWeight: 600,
          fill: "#ffffff",
          position: { x: 0, y: 0 },
          size: { width: BASE_PL_SIZE, height: 40 },
        },
      ],
    },
    {
      name: "Background",
      id: "player-bg",
      type: "rect",
      fill: "#000000",
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
      position: { x: 575, y: 30 },
      size: { width: 90, height: undefined },
    },
    {
      name: "Tag",
      type: "smartText",
      text: `${LayoutPlaceholder.PLAYER_PREFIX} | ${LayoutPlaceholder.PLAYER_TAG}`,
      fontSize: 140,
      fontWeight: 900,
      align: "center",
      anchor: "bottomMiddle",
      size: { width: BASE_PL_SIZE, height: 150 },
      position: { x: 0, y: 685 },
      shadowColor: "black",
      shadowOffset: { x: 10, y: 10 },
      conditions: [LayoutPlaceholder.PLAYER_PREFIX],
    },
    {
      name: "Tag",
      type: "smartText",
      text: LayoutPlaceholder.PLAYER_TAG,
      fontSize: 140,
      fontWeight: 900,
      align: "center",
      anchor: "bottomMiddle",
      size: { width: BASE_PL_SIZE, height: 150 },
      position: { x: 0, y: 685 },
      shadowColor: "black",
      shadowOffset: { x: 10, y: 10 },
      conditions: [RenderCondition.NOT, LayoutPlaceholder.PLAYER_PREFIX],
    },
    {
      name: "Placement",
      type: "text",
      text: LayoutPlaceholder.PLAYER_PLACEMENT,
      fontSize: 150,
      fontWeight: 900,
      fill: "#ffffff",
      position: { x: 45, y: 20 },
      stroke: "#ff0000",
      strokeWidth: 1,
    },
  ],
};

const getScale = (size: number) => ({
  x: size / BASE_PL_SIZE,
  y: size / BASE_PL_SIZE,
});

const getFirstRowPositions = () => {
  const row: {
    position: { x: number; y: number };
    scale: { x: number; y: number };
  }[] = [];
  const remainingWidth =
    CANVAS_WIDTH - PADDING * 2 - MAIN_PL_SIZE - PLAYER_SPACING;

  const playerWidth = (remainingWidth - PLAYER_SPACING * 2) / 3;

  for (let i = 0; i < 3; i++) {
    row.push({
      position: {
        x:
          PADDING +
          MAIN_PL_SIZE +
          PLAYER_SPACING +
          i * (playerWidth + PLAYER_SPACING),
        y: PADDING + (CANVAS_HEIGHT - MAIN_PL_SIZE - PADDING * 2) / 2,
      },
      scale: getScale(playerWidth),
    });
  }

  return row;
};

const getSecondRowPositions = () => {
  const row: {
    position: { x: number; y: number };
    scale: { x: number; y: number };
  }[] = [];
  const remainingWidth =
    CANVAS_WIDTH - PADDING * 2 - MAIN_PL_SIZE - PLAYER_SPACING;

  const playerWidth = (remainingWidth - PLAYER_SPACING * 3) / 4;

  const y =
    PADDING +
    (CANVAS_HEIGHT - MAIN_PL_SIZE - PADDING * 2) / 2 +
    MAIN_PL_SIZE -
    playerWidth +
    SECOND_ROW_Y_OFFSET;

  for (let i = 0; i < 4; i++) {
    row.push({
      position: {
        x:
          PADDING +
          MAIN_PL_SIZE +
          PLAYER_SPACING +
          i * (playerWidth + PLAYER_SPACING),
        y,
      },
      scale: getScale(playerWidth),
    });
  }

  return row;
};

const firstRow: {
  position: { x: number; y: number };
  scale: { x: number; y: number };
}[] = getFirstRowPositions();

const secondRow: {
  position: { x: number; y: number };
  scale: { x: number; y: number };
}[] = getSecondRowPositions();

const players: Partial<PlayerLayoutConfig>[] = [
  {
    position: {
      x: PADDING,
      y: PADDING + (CANVAS_HEIGHT - MAIN_PL_SIZE - PADDING * 2) / 2,
    },
    scale: getScale(MAIN_PL_SIZE),
  },
  {
    ...firstRow[0],
    // elements: [
    //   {
    //     type: "rect",
    //     fill: "#000000",
    //     position: { x: 0, y: 0 },
    //     size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
    //   },
    //   {
    //     type: "svg",
    //     src: "/assets/top8/theme/mini/smash_ball.svg",
    //     position: { x: 0, y: 0 },
    //     size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
    //     palette: {
    //       color_1: "rgba(255, 255, 255, 0.2)",
    //     },
    //   },
    //   {
    //     type: "characterImage",
    //     position: { x: 0, y: 0 },
    //     size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
    //     clip: true,
    //     shadowBlur: 2,
    //   },
    //   {
    //     type: "svg",
    //     src: "/assets/top8/theme/mini/frame.svg",
    //     position: { x: 0, y: 0 },
    //     size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
    //     palette: {
    //       color_1: "rgb(97, 233, 24)",
    //     },
    //   },
    //   ...basePlayer.elements.slice(4),
    // ],
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

export const simpleLayout: LayoutConfig = {
  canvas: {
    size: {
      width: 1920,
      height: 1080,
    },
    displayScale: 0.5,
    colorPalette: {
      primary: "rgb(179, 0, 0)",
      secondary: "rgb(235, 171, 64)",
      accent: "rgb(255, 255, 255)",
    },
  },
  background: {
    elements: [
      {
        id: "bg",
        type: "svg",
        src: "/assets/top8/theme/mini/bg.svg",
        position: { x: 0, y: 0 },
        size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
        palette: {
          color_1: "primary",
          color_2: "secondary",
        },
      },
      {
        id: "smashBall",
        type: "svg",
        src: "/assets/top8/theme/mini/smash_ball.svg",
        position: {
          x: (CANVAS_WIDTH - SMASH_BALL_SIZE) / 2 + 390,
          y: (CANVAS_HEIGHT - SMASH_BALL_SIZE) / 2 - 300,
        },
        size: { width: SMASH_BALL_SIZE, height: SMASH_BALL_SIZE },
        palette: {
          color_1: "accent",
        },
      },
    ],
  },
  tournament: {
    elements: [
      {
        id: "topLeftText",
        type: "text",
        position: { x: PADDING, y: PADDING },
        text: `${LayoutPlaceholder.TOURNAMENT_NAME} - ${LayoutPlaceholder.EVENT_NAME}`,
        fontSize: 40,
        fontWeight: 900,
        fill: "#ffffff",
        name: "Top Left Text",
        conditions: [RenderCondition.NOT, RenderCondition.TOURNAMENT_ICON],
      },
      {
        id: "topRightText",
        type: "smartText",
        position: { x: CANVAS_WIDTH - PADDING, y: PADDING },
        text: "smash-ranker.vercel.app",
        fontSize: 40,
        fontWeight: 900,
        fill: "#ffffff",
        name: "Top Right Text",
        anchor: "topRight",
        conditions: [RenderCondition.NOT, RenderCondition.TOURNAMENT_ICON],
      },
      {
        id: "tournamentIcon",
        type: "tournamentIcon",
        position: { x: PADDING, y: PADDING },
        size: { width: 150, height: 150 },
        conditions: [RenderCondition.TOURNAMENT_ICON],
        fillMode: "contain",
        align: "top",
      },
      {
        id: "bottomText",
        type: "text",
        position: { x: PADDING, y: CANVAS_HEIGHT - PADDING - 40 },
        text: `${LayoutPlaceholder.TOURNAMENT_DATE} - ${LayoutPlaceholder.TOURNAMENT_LOCATION} - ${LayoutPlaceholder.ENTRANTS} Entrants`,
        fontSize: 40,
        fontWeight: 900,
        fill: "#ffffff",
        name: "Bottom Text",
      },
    ],
  },
  basePlayer,
  players,
};
