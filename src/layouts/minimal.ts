import { LayoutConfig } from "@/types/top8/Layout";
import { LayoutPlaceholder } from "@/consts/top8/placeholders";

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
        x: 30,
        y: 30,
        fontSize: 70,
        fontWeight: "900",
        fill: "white",
        align: "center",
        text: LayoutPlaceholder.TOURNAMENT_NAME,
      },
      {
        type: "text",
        x: 30,
        y: 110,
        fontSize: 45,
        fontWeight: "600",
        fill: "#e0e0e0",
        align: "center",
        text: LayoutPlaceholder.EVENT_NAME,
      },
    ],
  },
  players: [
    {
      position: { x: 100, y: 200 },
      size: { width: 600, height: 600 },
      character: {
        x: 0,
        y: 0,
      },
      alternateCharacters: {
        x: 0,
        y: 0,
      },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        fontSize: 100,
        x: 0,
        y: 0,
      },
    },
    {
      position: { x: 720, y: 200 },
      size: { width: 400, height: 400 },
      character: {
        x: 0,
        y: 0,
      },
      alternateCharacters: {
        x: 0,
        y: 0,
      },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        x: 0,
        y: 0,
      },
    },
    {
      position: { x: 1140, y: 200 },
      size: { width: 400, height: 400 },
      character: {
        x: 0,
        y: 0,
      },
      alternateCharacters: {
        x: 0,
        y: 0,
      },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        x: 0,
        y: 0,
      },
    },
    {
      position: { x: 1560, y: 200 },
      size: { width: 300, height: 300 },
      character: {
        x: 0,
        y: 0,
      },
      alternateCharacters: {
        x: 0,
        y: 0,
      },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        x: 0,
        y: 0,
      },
    },
    {
      position: { x: 720, y: 620 },
      size: { width: 300, height: 300 },
      character: {
        x: 0,
        y: 0,
      },
      alternateCharacters: {
        x: 0,
        y: 0,
      },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        x: 0,
        y: 0,
      },
    },
    {
      position: { x: 1040, y: 620 },
      size: { width: 300, height: 300 },
      character: {
        x: 0,
        y: 0,
      },
      alternateCharacters: {
        x: 0,
        y: 0,
      },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        x: 0,
        y: 0,
      },
    },
    {
      position: { x: 1360, y: 620 },
      size: { width: 300, height: 300 },
      character: {
        x: 0,
        y: 0,
      },
      alternateCharacters: {
        x: 0,
        y: 0,
      },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        x: 0,
        y: 0,
      },
    },
    {
      position: { x: 1680, y: 620 },
      size: { width: 200, height: 200 },
      character: {
        x: 0,
        y: 0,
      },
      alternateCharacters: {
        x: 0,
        y: 0,
      },
      name: {
        type: "text",
        text: LayoutPlaceholder.PLAYER_NAME,
        x: 0,
        y: 0,
      },
    },
  ],
};
