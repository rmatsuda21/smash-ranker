import { LayoutConfig, PlayerLayoutConfig } from "@/types/top8/Layout";
import { LayoutPlaceholder } from "@/consts/top8/placeholders";

const playerBase: Partial<PlayerLayoutConfig> = {
  character: {
    x: 0,
    y: 0,
  },
  alternateCharacters: {
    x: 0,
    y: 0,
  },
};

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
    frame: {
      type: "image",
      imgSrc: "/assets/top8/theme/wtf/frame.svg",
    },
  },
  tournament: {
    elements: [
      {
        type: "text",
        x: 0,
        y: 0,
        text: `${LayoutPlaceholder.TOURNAMENT_NAME} - ${LayoutPlaceholder.EVENT_NAME}`,
        fontSize: 50,
        fontStyle: "bold",
        fontWeight: "black",
        fill: "white",
      },
      {
        type: "text",
        x: 0,
        y: 50,
        text: LayoutPlaceholder.TOURNAMENT_DATE,
        fontSize: 50,
        fontStyle: "bold",
        fontWeight: "black",
        fill: "white",
      },
    ],
  },
  players: [
    {
      ...playerBase,
      position: { x: 25, y: 190 },
      size: { width: 700, height: 700 },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        fontSize: 110,
        x: 0,
        y: 690,
      },
      placement: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_PLACEMENT,
        fontSize: 160,
        fontWeight: "black",
        x: 45,
        y: 20,
      },
    },
    {
      ...playerBase,
      position: { x: 740, y: 190 },
      size: { width: 350, height: 350 },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        fontSize: 70,
        x: 0,
        y: 340,
      },
      placement: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_PLACEMENT,
        fontSize: 80,
        fontWeight: "black",
        x: 25,
        y: 10,
      },
    },
    {
      ...playerBase,
      position: { x: 1105, y: 190 },
      size: { width: 350, height: 350 },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        fontSize: 70,
        x: 0,
        y: 340,
      },
      placement: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_PLACEMENT,
        fontSize: 80,
        fontWeight: "black",
        x: 25,
        y: 10,
      },
    },
    {
      ...playerBase,
      position: { x: 1470, y: 190 },
      size: { width: 350, height: 350 },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        fontSize: 70,
        x: 0,
        y: 340,
      },
      placement: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_PLACEMENT,
        fontSize: 80,
        fontWeight: "black",
        x: 25,
        y: 10,
      },
    },
    {
      ...playerBase,
      position: { x: 740, y: 555 },
      size: { width: 250, height: 250 },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        fontSize: 50,
        x: 0,
        y: 240,
      },
      placement: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_PLACEMENT,
        fontSize: 60,
        fontWeight: "black",
        x: 18,
        y: 10,
      },
    },
    {
      ...playerBase,
      position: { x: 1000, y: 555 },
      size: { width: 250, height: 250 },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        fontSize: 50,
        x: 0,
        y: 240,
      },
      placement: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_PLACEMENT,
        fontSize: 60,
        fontWeight: "black",
        x: 18,
        y: 10,
      },
    },
    {
      ...playerBase,
      position: { x: 1260, y: 555 },
      size: { width: 250, height: 250 },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        fontSize: 50,
        x: 0,
        y: 240,
      },
      placement: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_PLACEMENT,
        fontSize: 60,
        fontWeight: "black",
        x: 18,
        y: 10,
      },
    },
    {
      ...playerBase,
      position: { x: 1520, y: 555 },
      size: { width: 250, height: 250 },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        fontSize: 50,
        x: 0,
        y: 240,
      },
      placement: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_PLACEMENT,
        fontSize: 60,
        fontWeight: "black",
        x: 18,
        y: 10,
      },
    },
  ],
};
