import { LayoutConfig, PlayerLayoutConfig } from "@/types/top8/Layout";
import { LayoutPlaceholder } from "@/consts/top8/placeholders";

const basePlayer: PlayerLayoutConfig = {
  position: { x: 0, y: 0 },
  size: { width: 600, height: 600 },
  character: {
    position: { x: 0, y: 0 },
  },
  alternateCharacters: {
    position: { x: 0, y: 0 },
  },
  name: {
    type: "text",
    text: LayoutPlaceholder.PLAYER_NAME,
    fontSize: 100,
    position: { x: 0, y: 0 },
  },
};

export const minimalLayout: LayoutConfig = {
  canvas: {
    size: {
      width: 1920,
      height: 1080,
    },
    displayScale: 0.5,
    background: {
      type: "color",
      color: "#1a1a1a",
    },
  },
  tournament: {
    elements: [
      {
        type: "text",
        position: { x: 30, y: 30 },
        fontSize: 70,
        fontWeight: "900",
        fill: "white",
        align: "center",
        text: LayoutPlaceholder.TOURNAMENT_NAME,
      },
      {
        type: "text",
        position: { x: 30, y: 110 },
        fontSize: 45,
        fontWeight: "600",
        fill: "#e0e0e0",
        align: "center",
        text: LayoutPlaceholder.EVENT_NAME,
      },
    ],
  },
  basePlayer,
  players: [
    {
      position: { x: 100, y: 200 },
    },
    {
      position: { x: 720, y: 200 },
      scale: { x: 400 / 600, y: 400 / 600 },
    },
    {
      position: { x: 1140, y: 200 },
      scale: { x: 400 / 600, y: 400 / 600 },
    },
    {
      position: { x: 1560, y: 200 },
      scale: { x: 300 / 600, y: 300 / 600 },
    },
    {
      position: { x: 720, y: 620 },
      scale: { x: 300 / 600, y: 300 / 600 },
    },
    {
      position: { x: 1040, y: 620 },
      scale: { x: 300 / 600, y: 300 / 600 },
    },
    {
      position: { x: 1360, y: 620 },
      scale: { x: 300 / 600, y: 300 / 600 },
    },
    {
      position: { x: 1680, y: 620 },
      scale: { x: 200 / 600, y: 200 / 600 },
    },
  ],
};
