import { LayoutConfig } from "@/types/top8/Layout";

export const simpleLayout: LayoutConfig = {
  canvas: {
    size: {
      width: 1920,
      height: 1080,
    },
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
        text: "<tournamentName>",
        fontSize: 50,
        fontStyle: "bold",
        fontWeight: "black",
        fill: "white",
      },
      {
        type: "text",
        x: 0,
        y: 50,
        text: "<eventName>",
        fontSize: 50,
        fontStyle: "bold",
        fontWeight: "black",
        fill: "white",
      },
      {
        type: "text",
        x: 0,
        y: 100,
        text: "<date>",
        fontSize: 50,
        fontStyle: "bold",
        fontWeight: "black",
        fill: "white",
      },
    ],
  },
  players: [
    {
      position: { x: 25, y: 190 },
      size: { width: 700, height: 700 },
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
        fontSize: 110,
        x: 0,
        y: 690,
      },
    },
    {
      position: { x: 740, y: 190 },
      size: { width: 350, height: 350 },
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
        fontSize: 70,
        x: 0,
        y: 340,
      },
    },
    {
      position: { x: 1105, y: 190 },
      size: { width: 350, height: 350 },
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
        fontSize: 70,
        x: 0,
        y: 340,
      },
    },
    {
      position: { x: 1470, y: 190 },
      size: { width: 350, height: 350 },
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
        fontSize: 70,
        x: 0,
        y: 340,
      },
    },
    {
      position: { x: 740, y: 555 },
      size: { width: 250, height: 250 },
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
        fontSize: 50,
        x: 0,
        y: 240,
      },
    },
    {
      position: { x: 1000, y: 555 },
      size: { width: 250, height: 250 },
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
        fontSize: 50,
        x: 0,
        y: 240,
      },
    },
    {
      position: { x: 1260, y: 555 },
      size: { width: 250, height: 250 },
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
        fontSize: 50,
        x: 0,
        y: 240,
      },
    },
    {
      position: { x: 1520, y: 555 },
      size: { width: 250, height: 250 },
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
        fontSize: 50,
        x: 0,
        y: 240,
      },
    },
  ],
};
