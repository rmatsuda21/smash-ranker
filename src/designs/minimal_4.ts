import { Design, LayerDesign, PlayerDesign } from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

const CANVAS_WIDTH = 900;
const PADDING = 55;
const TOURNAMENT_ICON_SIZE = 150;

const PLAYER_COUNT = 4;
const PLAYER_SPACING = 10;
const PLAYER_WIDTH = CANVAS_WIDTH - PADDING * 2;
const PLAYER_HEIGHT = 100;
const FLAG_SIZE = 40;
const CHARACTER_IMAGE_SIZE = 70;
const CANVAS_HEIGHT =
  PADDING * 2 +
  TOURNAMENT_ICON_SIZE +
  PLAYER_HEIGHT * PLAYER_COUNT +
  PLAYER_SPACING * (PLAYER_COUNT - 1);

const basePlayer: PlayerDesign = {
  position: { x: PADDING, y: 190 },
  size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
  scale: { x: 1, y: 1 },
  elements: [
    {
      type: "rect",
      fill: "primary",
      position: { x: 0, y: 0 },
      size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
    },
    {
      type: "flexGroup",
      id: "main",
      name: "Main",
      position: { x: 40, y: 0 },
      size: { width: PLAYER_WIDTH - 80, height: PLAYER_HEIGHT },
      direction: "row",
      align: "center",
      gap: 10,
      elements: [
        {
          type: "text",
          text: DesignPlaceholder.PLAYER_PLACEMENT,
          fontSize: 55,
          fontWeight: 900,
          fill: "text",
          align: "left",
          verticalAlign: "middle",
          position: { x: 0, y: 0 },
          size: { width: PLAYER_HEIGHT - 20, height: PLAYER_HEIGHT },
        },
        {
          type: "playerFlag",
          position: { x: 0, y: 0 },
          size: { width: FLAG_SIZE, height: FLAG_SIZE },
          conditions: [DesignPlaceholder.PLAYER_COUNTRY],
          fillMode: "contain",
          align: "center",
        },
        {
          type: "flexGroup",
          id: "fullNameGroup",
          position: { x: 0, y: 0 },
          size: { width: 150, height: 32 },
          justify: "start",
          align: "end",
          gap: 5,
          conditions: [DesignPlaceholder.PLAYER_PREFIX],
          flex: { grow: true },
          elements: [
            {
              type: "smartText",
              text: `${DesignPlaceholder.PLAYER_PREFIX}`,
              id: "fullNameText",
              fontSize: 18,
              align: "left",
              verticalAlign: "middle",
              fontWeight: 900,
              fill: "text",
              filterEffects: [{ type: "Brightness", brightness: 0.5 }],
              position: { x: 0, y: 0 },
            },
            {
              type: "smartText",
              text: `${DesignPlaceholder.PLAYER_TAG}`,
              id: "tagText",
              fontSize: 32,
              align: "left",
              verticalAlign: "top",
              fontWeight: 900,
              fill: "text",
              position: { x: 0, y: 0 },
              flex: { shrink: true },
            },
          ],
        },
        {
          type: "smartText",
          text: DesignPlaceholder.PLAYER_TAG,
          id: "tagText",
          conditions: [RenderCondition.NOT, DesignPlaceholder.PLAYER_PREFIX],
          fontSize: 32,
          align: "left",
          verticalAlign: "middle",
          fontWeight: 900,
          fill: "text",
          position: { x: 0, y: 0 },
          size: { height: 50 },
          flex: { shrink: true, grow: true },
        },
        {
          type: "flexGroup",
          id: "characterImageGroup",
          position: { x: 0, y: 0 },
          size: {
            width: 150 + CHARACTER_IMAGE_SIZE + 5,
            height: PLAYER_HEIGHT,
          },
          direction: "row",
          align: "center",
          gap: 15,
          elements: [
            {
              type: "altCharacterImage",
              id: "altCharacterImage",
              position: { x: 0, y: 0 },
              size: { width: 150, height: CHARACTER_IMAGE_SIZE - 15 },
              gap: 5,
              alignLastRow: "end",
              justify: "end",
              align: "center",
              flex: { shrink: true, grow: false },
            },
            {
              type: "group",
              position: { x: 0, y: 0 },
              size: {
                width: CHARACTER_IMAGE_SIZE,
                height: CHARACTER_IMAGE_SIZE,
              },
              clip: true,
              elements: [
                {
                  type: "rect",
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
                  type: "characterImage",
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
                  type: "rect",
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
  ],
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

const players = Array.from({ length: PLAYER_COUNT }, (_, index) => {
  const baseConfig = {
    id: `player-${index}`,
    name: `Player ${index + 1}`,
    position: {
      x: PADDING,
      y:
        PADDING +
        TOURNAMENT_ICON_SIZE +
        PLAYER_SPACING +
        index * (PLAYER_HEIGHT + PLAYER_SPACING),
    },
    size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
  };

  return baseConfig;
});

export const minimal4Design: Design = {
  name: "Minimal",
  author: "@chikyunojin",
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
