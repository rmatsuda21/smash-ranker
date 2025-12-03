import { LayoutConfig, PlayerLayoutConfig } from "@/types/top8/LayoutTypes";
import { LayoutPlaceholder } from "@/consts/top8/placeholders";

const PADDING = 40;
const PLAYER_SPACING = 15;
const BASE_PL_SIZE = 700;
const MAIN_PL_SIZE = 670;
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const basePlayer: PlayerLayoutConfig = {
  frame: {
    type: "image",
    imgSrc: "/assets/top8/theme/wtf/frame.svg",
  },
  position: { x: 25, y: 190 },
  size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
  scale: { x: 1, y: 1 },
  elements: [
    {
      type: "rect",
      fill: "#000000",
      position: { x: 0, y: 0 },
      size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
    },
    {
      type: "characterImage",
      position: { x: 0, y: 0 },
      size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
      clip: true,
    },
    {
      type: "svg",
      src: "/assets/top8/theme/mini/frame.svg",
      position: { x: 0, y: 0 },
      size: { width: BASE_PL_SIZE, height: BASE_PL_SIZE },
    },
    {
      type: "altCharacterImage",
      position: { x: 575, y: 30 },
      size: { width: 90, height: undefined },
    },
    {
      type: "smartText",
      text: LayoutPlaceholder.PLAYER_TAG,
      fontSize: 140,
      fontWeight: "900",
      verticalAlign: "bottom",
      align: "center",
      size: { width: BASE_PL_SIZE, height: 150 },
      position: { x: 0, y: 690 },
      shadowColor: "black",
      shadowOffset: { x: 7, y: 7 },
      shadowOpacity: 1,
    },
    {
      type: "text",
      text: LayoutPlaceholder.PLAYER_PLACEMENT,
      fontSize: 120,
      fontWeight: "900",
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
    playerWidth;

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
    background: {
      type: "image",
      imgSrc: "/assets/top8/theme/wtf/background.svg",
    },
  },
  tournament: {
    elements: [
      {
        type: "text",
        position: { x: PADDING, y: PADDING },
        text: `${LayoutPlaceholder.TOURNAMENT_NAME} - ${LayoutPlaceholder.EVENT_NAME}`,
        fontSize: 50,
        fontWeight: "900",
        fill: "#ffffff",
        name: "Name",
      },
      {
        type: "text",
        position: { x: PADDING, y: PADDING + 60 },
        text: LayoutPlaceholder.TOURNAMENT_DATE,
        fontSize: 50,
        fontWeight: "900",
        fill: "#ffffff",
        name: "Date",
      },
    ],
  },
  basePlayer,
  players,
};
