import { LayoutConfig, PlayerLayoutConfig } from "@/types/top8/LayoutTypes";
import { LayoutPlaceholder } from "@/consts/top8/placeholders";

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
          fill: "rgb(203, 65, 65)",
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
          condition: LayoutPlaceholder.PLAYER_TWITTER,
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
        color_1: "rgb(203, 65, 65)",
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
      text: LayoutPlaceholder.PLAYER_TAG,
      fontSize: 140,
      fontWeight: 900,
      verticalAlign: "bottom",
      align: "center",
      size: { width: BASE_PL_SIZE, height: 150 },
      position: { x: 0, y: 685 },
      shadowColor: "black",
      shadowOffset: { x: 10, y: 10 },
    },
    {
      name: "Placement",
      type: "text",
      text: LayoutPlaceholder.PLAYER_PLACEMENT,
      fontSize: 120,
      fontWeight: 900,
      fill: "#ffffff",
      position: { x: 45, y: 20 },
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
          color_1: "rgb(179, 0, 0)",
          color_2: "rgb(235, 171, 64)",
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
          color_1: "rgba(255, 255, 255, 0.2)",
        },
      },
    ],
  },
  tournament: {
    elements: [
      {
        id: "topText",
        type: "text",
        position: { x: PADDING, y: PADDING },
        text: `${LayoutPlaceholder.TOURNAMENT_NAME} - ${LayoutPlaceholder.EVENT_NAME}`,
        fontSize: 50,
        fontWeight: 900,
        fill: "#ffffff",
        name: "Top Text",
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
