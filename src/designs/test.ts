import { Design, LayerDesign, PlayerDesign } from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

const PADDING = 40;
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 635;
const TOURNAMENT_ICON_SIZE = 75;

const PLAYER_WIDTH = CANVAS_WIDTH - PADDING * 2;
const PLAYER_HEIGHT = 50;

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
      position: { x: 20, y: 0 },
      size: { width: PLAYER_WIDTH - 40, height: PLAYER_HEIGHT },
      direction: "row",
      align: "center",
      gap: 10,
      elements: [
        {
          type: "text",
          text: DesignPlaceholder.PLAYER_PLACEMENT,
          fontSize: 35,
          fontWeight: 900,
          fill: "text",
          align: "left",
          verticalAlign: "middle",
          position: { x: 0, y: 0 },
          size: { width: PLAYER_HEIGHT - 20, height: PLAYER_HEIGHT },
        },
        {
          type: "userFlag",
          position: { x: 0, y: 0 },
          size: { width: PLAYER_HEIGHT - 20, height: PLAYER_HEIGHT - 20 },
          conditions: [DesignPlaceholder.PLAYER_COUNTRY],
          fillMode: "contain",
          align: "center",
          verticalAlign: "middle",
        },
        {
          type: "text",
          text: `${DesignPlaceholder.PLAYER_PREFIX} | ${DesignPlaceholder.PLAYER_TAG}`,
          id: "fullNameText",
          conditions: [DesignPlaceholder.PLAYER_PREFIX],
          fontSize: 15,
          align: "left",
          verticalAlign: "middle",
          fontWeight: 900,
          fill: "text",
          position: { x: 0, y: 0 },
          size: { width: 150, height: PLAYER_HEIGHT },
          flex: { grow: true },
        },
        {
          type: "text",
          text: DesignPlaceholder.PLAYER_TAG,
          id: "tagText",
          conditions: [RenderCondition.NOT, DesignPlaceholder.PLAYER_PREFIX],
          fontSize: 15,
          align: "left",
          verticalAlign: "middle",
          fontWeight: 900,
          fill: "text",
          position: { x: 0, y: 0 },
          size: { width: 150, height: PLAYER_HEIGHT },
          flex: { grow: true },
        },
        {
          type: "characterImage",
          id: "characterImage",
          name: "Character Image",
          shadowEnabled: false,
          position: { x: 0, y: 0 },
          size: { width: PLAYER_HEIGHT, height: PLAYER_HEIGHT },
          flex: { shrink: true, grow: false },
        },
      ],
    },
  ],
};

const colorPalette: Design["colorPalette"] = {
  primary: { color: "rgba(142, 142, 142, 0.21)", name: "Primary" },
  background: { color: "rgb(0, 0, 0)", name: "Background" },
  text: { color: "rgb(255, 255, 255)", name: "Text" },
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
      position: { x: PADDING, y: PADDING },
      size: { width: CANVAS_WIDTH - PADDING * 2, height: TOURNAMENT_ICON_SIZE },
      direction: "row",
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
        },
        {
          type: "flexGroup",
          position: { x: 0, y: 0 },
          size: {
            width: CANVAS_WIDTH - PADDING * 2 - TOURNAMENT_ICON_SIZE - 10,
            height: TOURNAMENT_ICON_SIZE,
          },
          direction: "column",
          justify: "center",
          gap: 0,
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
              size: { width: CANVAS_WIDTH - PADDING * 2 },
              selectable: true,
            },
          ],
        },
      ],
    },
  ],
};

const players: Partial<PlayerDesign>[] = Array.from(
  { length: 8 },
  (_, index) => ({
    id: `player-${index}`,
    name: `Player ${index + 1}`,
    position: { x: PADDING, y: 130 + index * (PLAYER_HEIGHT + 10) },
  })
);

export const testDesign: Design = {
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
  players,
};
