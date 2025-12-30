import { Design, PlayerConfig } from "@/types/top8/Design";
import { LayoutPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

const PADDING = 40;
const PLAYER_SPACING = 15;
const BASE_PL_SIZE = 700;
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const TOURNAMENT_ICON_SIZE = 110;
const SMASH_BALL_SIZE = 1600;

const PLAYER_SIZE = 370;

const basePlayer: PlayerConfig = {
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
          fill: "text",
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
          fill: "text",
          position: { x: 0, y: 0 },
          size: { width: BASE_PL_SIZE, height: 40 },
        },
      ],
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
      position: { x: 575, y: 30 },
      size: { width: 90, height: undefined },
    },
    {
      name: "Full Name",
      type: "smartText",
      text: `${LayoutPlaceholder.PLAYER_PREFIX} | ${LayoutPlaceholder.PLAYER_TAG}`,
      fontSize: 140,
      fontWeight: 900,
      align: "center",
      anchor: "bottomMiddle",
      size: { width: BASE_PL_SIZE, height: 150 },
      position: { x: 0, y: 685 },
      fill: "text",
      shadowColor: "textShadow",
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
      fill: "text",
      shadowColor: "textShadow",
      shadowOffset: { x: 10, y: 10 },
      conditions: [RenderCondition.NOT, LayoutPlaceholder.PLAYER_PREFIX],
    },
    {
      name: "Placement",
      type: "text",
      text: LayoutPlaceholder.PLAYER_PLACEMENT,
      fontSize: 150,
      fontWeight: 900,
      fill: "text",
      position: { x: 45, y: 20 },
    },
  ],
};

const getScale = (size: number) => ({
  x: size / BASE_PL_SIZE,
  y: size / BASE_PL_SIZE,
});

const TWITTER_HEIGHT = 50 * getScale(PLAYER_SIZE).y;
const remainingWidth =
  CANVAS_WIDTH - PADDING * 2 - PLAYER_SIZE * 4 - PLAYER_SPACING * 3;
const remainingHeight =
  CANVAS_HEIGHT - PADDING * 2 - PLAYER_SIZE * 2 - TWITTER_HEIGHT * 2;
const startX = PADDING + remainingWidth / 2;
const startY = PADDING + remainingHeight / 2;

const getFirstRowPositions = () => {
  const row: {
    position: { x: number; y: number };
    scale: { x: number; y: number };
  }[] = [];

  for (let i = 0; i < 4; i++) {
    row.push({
      position: {
        x: startX + i * (PLAYER_SIZE + PLAYER_SPACING),
        y: startY,
      },
      scale: getScale(PLAYER_SIZE),
    });
  }

  return row;
};

const getSecondRowPositions = () => {
  const row: {
    position: { x: number; y: number };
    scale: { x: number; y: number };
  }[] = [];

  for (let i = 0; i < 4; i++) {
    row.push({
      position: {
        x: startX + i * (PLAYER_SIZE + PLAYER_SPACING),
        y: startY + PLAYER_SIZE + PLAYER_SPACING + TWITTER_HEIGHT,
      },
      scale: getScale(PLAYER_SIZE),
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

const players: Partial<PlayerConfig>[] = [
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
    ...firstRow[3],
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

export const squaresLayout: Design = {
  canvas: {
    size: {
      width: 1920,
      height: 1080,
    },
    displayScale: 0.5,
    colorPalette: {
      primary: { color: "rgb(179, 0, 0)", name: "Primary" },
      secondary: { color: "rgb(235, 171, 64)", name: "Secondary" },
      background: { color: "rgb(0, 0, 0)", name: "Background" },
      accent: { color: "rgba(255, 255, 255, 0.2)", name: "Accent" },
      text: { color: "rgb(255, 255, 255)", name: "Text" },
      textShadow: { color: "rgb(0, 0, 0)", name: "Text Shadow" },
      playerBackground: { color: "rgb(0, 0, 0)", name: "Player Background" },
      characterShadow: { color: "rgb(255, 0, 0)", name: "Character Shadow" },
    },
    textPalette: {
      tournamentName: {
        text: `${LayoutPlaceholder.TOURNAMENT_NAME} - ${LayoutPlaceholder.EVENT_NAME}`,
        name: "Tournament Name",
      },
      topRightText: {
        text: "smash-ranker.vercel.app",
        name: "Top Right Text",
      },
      bottomText: {
        text: `${LayoutPlaceholder.TOURNAMENT_DATE} - ${LayoutPlaceholder.TOURNAMENT_LOCATION} - ${LayoutPlaceholder.ENTRANTS} Entrants`,
        name: "Bottom Text",
      },
    },
  },
  background: {
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
          color_1: "accent",
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
          color_1: "primary",
          color_2: "secondary",
        },
      },
    ],
  },
  tournament: {
    elements: [
      {
        type: "text",
        id: "tournamentName",
        name: "Tournament Name",
        position: { x: PADDING, y: PADDING },
        textId: "tournamentName",
        fontSize: 40,
        fontWeight: 900,
        fill: "text",
        conditions: [RenderCondition.NOT, RenderCondition.TOURNAMENT_ICON],
      },
      {
        type: "smartText",
        id: "topRightText",
        name: "Top Right Text",
        position: { x: CANVAS_WIDTH - PADDING, y: PADDING },
        textId: "topRightText",
        fontSize: 25,
        fontWeight: 900,
        fill: "text",
        anchor: "topRight",
      },
      {
        type: "tournamentIcon",
        id: "tournamentIcon",
        name: "Tournament Icon",
        position: { x: PADDING, y: 10 },
        size: { width: TOURNAMENT_ICON_SIZE, height: TOURNAMENT_ICON_SIZE },
        conditions: [RenderCondition.TOURNAMENT_ICON],
        fillMode: "contain",
        align: "top",
      },
      {
        type: "text",
        id: "tournamentNameWithIcon",
        name: "Tournament Name (w/ Icon)",
        position: { x: PADDING + TOURNAMENT_ICON_SIZE + 20, y: PADDING },
        textId: "tournamentName",
        fontSize: 40,
        fontWeight: 900,
        fill: "text",
        conditions: [RenderCondition.TOURNAMENT_ICON],
      },
      {
        type: "text",
        id: "bottomText",
        name: "Bottom Text",
        position: { x: PADDING, y: CANVAS_HEIGHT - PADDING - 40 },
        textId: "bottomText",
        fontSize: 40,
        fontWeight: 900,
        fill: "text",
      },
    ],
  },
  basePlayer,
  players,
};
