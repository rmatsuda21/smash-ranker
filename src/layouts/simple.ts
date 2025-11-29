import { LayoutConfig, PlayerLayoutConfig } from "@/types/top8/Layout";
import { LayoutPlaceholder } from "@/consts/top8/placeholders";

const basePlayer: PlayerLayoutConfig = {
  frame: {
    type: "image",
    imgSrc: "/assets/top8/theme/wtf/frame.svg",
  },
  character: {
    position: { x: 0, y: 0 },
  },
  alternateCharacters: {
    position: { x: 0, y: 0 },
  },
  position: { x: 25, y: 190 },
  size: { width: 700, height: 700 },
  name: {
    type: "text",
    text: LayoutPlaceholder.PLAYER_NAME,
    fontSize: 110,
    position: { x: 0, y: 690 },
  },
  placement: {
    type: "text",
    text: LayoutPlaceholder.PLAYER_PLACEMENT,
    fontSize: 160,
    fontWeight: "black",
    position: { x: 45, y: 20 },
  },
};

const getScale = (size: number) => ({ x: size / 700, y: size / 700 });

const players: Partial<PlayerLayoutConfig>[] = [
  {
    position: { x: 25, y: 190 },
  },
  {
    position: { x: 740, y: 190 },
    scale: getScale(350),
  },
  {
    position: { x: 1105, y: 190 },
    scale: getScale(350),
  },
  {
    position: { x: 1470, y: 190 },
    scale: getScale(350),
  },
  {
    position: { x: 740, y: 555 },
    scale: getScale(250),
  },
  {
    position: { x: 1000, y: 555 },
    scale: getScale(250),
  },
  {
    position: { x: 1260, y: 555 },
    scale: getScale(250),
  },
  {
    position: { x: 1520, y: 555 },
    scale: getScale(250),
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
        position: { x: 0, y: 0 },
        text: `${LayoutPlaceholder.TOURNAMENT_NAME} - ${LayoutPlaceholder.EVENT_NAME}`,
        fontSize: 50,
        fontStyle: "bold",
        fontWeight: "black",
        fill: "white",
      },
      {
        type: "text",
        position: { x: 0, y: 50 },
        text: LayoutPlaceholder.TOURNAMENT_DATE,
        fontSize: 50,
        fontStyle: "bold",
        fontWeight: "black",
        fill: "white",
      },
    ],
  },
  basePlayer,
  players,
};
