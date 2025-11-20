import { LayoutConfig } from "@/types/top8/Layout";

export const minimalLayout: LayoutConfig = {
  canvas: {
    size: {
      width: 1920,
      height: 1080,
    },
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
        text: "<tournamentName>",
      },
      {
        type: "text",
        x: 30,
        y: 110,
        fontSize: 45,
        fontWeight: "600",
        fill: "#e0e0e0",
        align: "center",
        text: "<eventName>",
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
        text: "<name>",
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
        text: "<name>",
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
        text: "<name>",
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
        text: "<name>",
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
        text: "<name>",
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
        text: "<name>",
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
        text: "<name>",
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
        text: "<name>",
        x: 0,
        y: 0,
      },
    },
  ],
};
