import {
  Design,
  ElementConfig,
  LayerDesign,
  PlayerDesign,
} from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

const PADDING = 55;
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 1150;
const TOURNAMENT_ICON_SIZE = 150;

const PLAYER_WIDTH = CANVAS_WIDTH - PADDING * 2;
const PLAYER_HEIGHT = 100;
const FLAG_SIZE = 40;
const CHARACTER_IMAGE_SIZE = 70;

const createPlacementText = (
  fill: string,
  shadowColor?: string,
  shadowBlur?: number,
  shadowOpacity?: number
) => ({
  type: "text" as const,
  text: DesignPlaceholder.PLAYER_PLACEMENT,
  fontSize: 55,
  fontWeight: 900,
  fill,
  align: "left" as const,
  verticalAlign: "middle" as const,
  position: { x: 0, y: 0 },
  size: { width: PLAYER_HEIGHT - 20, height: PLAYER_HEIGHT },
  ...(shadowColor && {
    shadowColor,
    shadowBlur: shadowBlur ?? 15,
    shadowOffset: { x: 0, y: 0 },
    shadowOpacity: shadowOpacity ?? 0.8,
  }),
});

const createPlayerElements = (
  placementText: ReturnType<typeof createPlacementText>
) => [
  {
    type: "rect" as const,
    fill: "primary",
    position: { x: 0, y: 0 },
    size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
  },
  {
    type: "flexGroup" as const,
    id: "main",
    name: "Main",
    position: { x: 40, y: 0 },
    size: { width: PLAYER_WIDTH - 80, height: PLAYER_HEIGHT },
    direction: "row" as const,
    align: "center" as const,
    gap: 10,
    elements: [
      placementText,
      {
        type: "userFlag" as const,
        position: { x: 0, y: 0 },
        size: { width: FLAG_SIZE, height: FLAG_SIZE },
        conditions: [DesignPlaceholder.PLAYER_COUNTRY],
        fillMode: "contain" as const,
        align: "center" as const,
        verticalAlign: "middle" as const,
      },
      {
        type: "flexGroup" as const,
        id: "fullNameGroup",
        position: { x: 0, y: 0 },
        size: { width: 150, height: 32 },
        justify: "start" as const,
        align: "end" as const,
        gap: 5,
        conditions: [DesignPlaceholder.PLAYER_PREFIX],
        flex: { grow: true },
        elements: [
          {
            type: "smartText" as const,
            text: `${DesignPlaceholder.PLAYER_PREFIX}`,
            id: "fullNameText",
            fontSize: 18,
            align: "left" as const,
            verticalAlign: "middle" as const,
            fontWeight: 900,
            fill: "text",
            filterEffects: [{ type: "Brightness", brightness: 0.5 }],
            position: { x: 0, y: 0 },
          },
          {
            type: "smartText" as const,
            text: `${DesignPlaceholder.PLAYER_TAG}`,
            id: "tagText",
            fontSize: 32,
            align: "left" as const,
            verticalAlign: "start" as const,
            fontWeight: 900,
            fill: "text",
            position: { x: 0, y: 0 },
            flex: { shrink: true },
          },
        ],
      },
      {
        type: "smartText" as const,
        text: DesignPlaceholder.PLAYER_TAG,
        id: "tagText",
        conditions: [RenderCondition.NOT, DesignPlaceholder.PLAYER_PREFIX],
        fontSize: 32,
        align: "left" as const,
        verticalAlign: "middle" as const,
        fontWeight: 900,
        fill: "text",
        position: { x: 0, y: 0 },
        size: { height: 50 },
        flex: { shrink: true, grow: true },
      },
      {
        type: "flexGroup" as const,
        id: "characterImageGroup",
        position: { x: 0, y: 0 },
        size: { width: 150 + CHARACTER_IMAGE_SIZE + 5, height: PLAYER_HEIGHT },
        direction: "row" as const,
        align: "center" as const,
        gap: 15,
        elements: [
          {
            type: "altCharacterImage" as const,
            id: "altCharacterImage",
            position: { x: 0, y: 0 },
            size: { width: 150, height: CHARACTER_IMAGE_SIZE - 15 },
            direction: "row",
            wrap: true,
            gap: 5,
            align: "start",
            justify: "end",
            flex: { shrink: true, grow: false },
          },
          {
            type: "group" as const,
            position: { x: 0, y: 0 },
            size: { width: CHARACTER_IMAGE_SIZE, height: CHARACTER_IMAGE_SIZE },
            cornerRadius: 5,
            clip: true,
            stroke: "red",
            strokeWidth: 2,
            elements: [
              {
                type: "rect" as const,
                id: "characterBackground",
                fill: "characterBackground",
                position: { x: 0, y: 0 },
                size: {
                  width: CHARACTER_IMAGE_SIZE,
                  height: CHARACTER_IMAGE_SIZE,
                },
                cornerRadius: 5,
              },
              {
                type: "characterImage" as const,
                id: "characterImage",
                name: "Character Image",
                shadowEnabled: false,
                position: { x: 0, y: 0 },
                size: {
                  width: CHARACTER_IMAGE_SIZE,
                  height: CHARACTER_IMAGE_SIZE,
                },
                flex: { shrink: true, grow: false },
              },
              {
                type: "rect" as const,
                id: "characterBorder",
                fill: "transparent",
                stroke: "characterBorder",
                strokeWidth: 2,
                position: { x: 0, y: 0 },
                size: {
                  width: CHARACTER_IMAGE_SIZE,
                  height: CHARACTER_IMAGE_SIZE,
                },
                cornerRadius: 5,
              },
            ],
          },
        ],
      },
    ],
  },
];

const basePlayer: PlayerDesign = {
  position: { x: PADDING, y: 190 },
  size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
  scale: { x: 1, y: 1 },
  elements: createPlayerElements(
    createPlacementText("text")
  ) as unknown as ElementConfig[],
};

const colorPalette: Design["colorPalette"] = {
  primary: { color: "rgba(142, 142, 142, 0.21)", name: "Primary" },
  background: { color: "rgb(0, 0, 0)", name: "Background" },
  text: { color: "rgb(255, 255, 255)", name: "Text" },
  gold: { color: "#FFD700", name: "Gold" },
  silver: { color: "#C0C0C0", name: "Silver" },
  bronze: { color: "#CD7F32", name: "Bronze" },
  characterBackground: {
    color: "rgb(236, 236, 236)",
    name: "Character Background",
  },
  characterBorder: { color: "rgb(255, 255, 255)", name: "Character Border" },
};

const background: LayerDesign = {
  elements: [
    {
      type: "rect",
      fill: "background",
      position: { x: 0, y: 0 },
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    },
  ],
};

const tournament: LayerDesign = {
  elements: [
    {
      type: "flexGroup",
      id: "tournamentHeader",
      name: "Tournament Header",
      position: { x: PADDING, y: PADDING - 10 },
      size: { width: CANVAS_WIDTH - PADDING * 2, height: TOURNAMENT_ICON_SIZE },
      direction: "row",
      align: "center",
      gap: 10,
      elements: [
        {
          type: "tournamentIcon",
          id: "tournamentIcon",
          name: "Tournament Icon",
          position: { x: 0, y: 0 },
          size: {
            width: TOURNAMENT_ICON_SIZE,
            height: TOURNAMENT_ICON_SIZE,
          },
          conditions: [RenderCondition.TOURNAMENT_ICON],
          fillMode: "contain",
          align: "center",
          flex: { shrink: false, grow: true },
        },
        {
          type: "flexGroup",
          id: "tournamentInfoGroup",
          position: { x: 0, y: 0 },
          size: {
            width: CANVAS_WIDTH - PADDING * 2 - TOURNAMENT_ICON_SIZE - 10,
            height: TOURNAMENT_ICON_SIZE,
          },
          direction: "column",
          justify: "center",
          gap: 10,
          elements: [
            {
              type: "smartText",
              id: "topRightText",
              name: "Top Right Text",
              position: { x: 0, y: 0 },
              textId: "tournamentInfo",
              fontSize: 20,
              fontWeight: 900,
              fill: "text",
              size: {
                width: CANVAS_WIDTH - PADDING * 2 - TOURNAMENT_ICON_SIZE - 10,
              },
              align: "left",
              selectable: true,
            },
            {
              type: "smartText",
              id: "topLeftText",
              name: "Top Left Text",
              textId: "tournamentName",
              fontSize: 40,
              fontWeight: 900,
              fill: "text",
              align: "left",
              position: { x: 0, y: 0 },
              size: {
                width: CANVAS_WIDTH - PADDING * 2 - TOURNAMENT_ICON_SIZE - 10,
              },
              selectable: true,
            },
          ],
        },
      ],
    },
  ],
};

const players = Array.from({ length: 8 }, (_, index) => {
  const baseConfig = {
    id: `player-${index}`,
    name: `Player ${index + 1}`,
    position: {
      x: PADDING,
      y: PADDING + TOURNAMENT_ICON_SIZE + 10 + index * (PLAYER_HEIGHT + 10),
    },
    size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
  };

  return baseConfig;
});

export const minimalDesign: Design = {
  canvasSize: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  canvasDisplayScale: 0.5,
  colorPalette,
  textPalette: {
    tournamentName: {
      text: `${DesignPlaceholder.TOURNAMENT_NAME}`,
      name: "Tournament Name",
    },
    tournamentInfo: {
      text: `${DesignPlaceholder.TOURNAMENT_DATE} - ${DesignPlaceholder.TOURNAMENT_LOCATION} - ${DesignPlaceholder.ENTRANTS} Entrants`,
      name: "Tournament Info",
    },
  },
  background,
  tournament,
  basePlayer,
  players: players as unknown as Partial<PlayerDesign>[],
};
