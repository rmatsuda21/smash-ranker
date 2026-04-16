import { Design, LayerDesign, PlayerDesign } from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

const CANVAS_WIDTH = 1000;
const PADDING_BLOCK = 20;
const PADDING_INLINE = 20;
const TOURNAMENT_ICON_SIZE = 120;
const PLAYER_SPACING = 16;
const PLAYER_WIDTH = CANVAS_WIDTH - PADDING_INLINE * 2;
const PLAYER_HEIGHT = 80;
const PLAYER_PADDING_BLOCK = 10;
const FLAG_SIZE = 44;
const CHARACTER_IMAGE_SIZE = 60;

const colorPalette: Design["colorPalette"] = {
  primary: { color: "rgba(142, 142, 142, 0.21)", name: "Player BG" },
  characterBackground: {
    color: "rgb(236, 236, 236)",
    name: "Character BG",
  },
  characterBorder: { color: "rgb(255, 255, 255)", name: "Character Border" },
  backgroundStart: { color: "rgb(51, 51, 51)", name: "BG Gradient Start" },
  backgroundEnd: { color: "rgb(0, 0, 0)", name: "BG Gradient End" },
  text: { color: "rgb(255, 255, 255)", name: "Text" },
};

const basePlayer: PlayerDesign = {
  position: { x: PADDING_INLINE, y: 190 },
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
      position: { x: 30, y: PLAYER_PADDING_BLOCK },
      size: {
        width: PLAYER_WIDTH - 60,
        height: PLAYER_HEIGHT,
      },
      direction: "row",
      justify: "center",
      gap: 20,
      elements: [
        {
          type: "smartText",
          text: DesignPlaceholder.PLAYER_PLACEMENT,
          fontSize: 60,
          fontWeight: 900,
          fill: "text",
          verticalAlign: "top",
          position: { x: 0, y: -5 },
          size: { width: 50, height: CHARACTER_IMAGE_SIZE },
        },
        {
          type: "playerFlag",
          position: { x: 0, y: 0 },
          size: { width: FLAG_SIZE, height: CHARACTER_IMAGE_SIZE },
          conditions: [DesignPlaceholder.PLAYER_COUNTRY],
          fillMode: "contain",
        },
        {
          type: "flexGroup",
          id: "fullNameGroup",
          position: { x: 0, y: 0 },
          size: { width: 150, height: 46 },
          direction: "row",
          align: "end",
          gap: 10,
          conditions: [DesignPlaceholder.PLAYER_PREFIX],
          flex: { grow: true },
          elements: [
            {
              type: "smartText",
              text: `${DesignPlaceholder.PLAYER_PREFIX}`,
              id: "fullNameText",
              fontSize: 24,
              verticalAlign: "bottom",
              fontWeight: 900,
              fill: "text",
              filterEffects: [{ type: "Brightness", brightness: 0.5 }],
              position: { x: 0, y: 0 },
            },
            {
              type: "smartText",
              text: `${DesignPlaceholder.PLAYER_TAG}`,
              id: "tagText",
              fontSize: 40,
              verticalAlign: "bottom",
              fontWeight: 900,
              fill: "text",
              position: { x: 0, y: 0 },
              size: { height: 40 },
              flex: { shrink: true },
            },
          ],
        },
        {
          type: "smartText",
          text: DesignPlaceholder.PLAYER_TAG,
          id: "tagText",
          conditions: [RenderCondition.NOT, DesignPlaceholder.PLAYER_PREFIX],
          fontSize: 40,
          align: "left",
          verticalAlign: "bottom",
          fontWeight: 900,
          fill: "text",
          position: { x: 0, y: 0 },
          size: { width: 150, height: 48 },
          flex: { shrink: true, grow: true },
        },
        {
          type: "flexGroup",
          id: "characterImageGroup",
          position: { x: 0, y: 0 },
          size: {
            maxWidth: CHARACTER_IMAGE_SIZE * 6 + 6 * 5,
            height: CHARACTER_IMAGE_SIZE,
          },
          direction: "row",
          align: "start",
          justify: "end",
          gap: 6,
          clip: true,
          flex: { shrink: true, grow: false },
          elements: [
            {
              type: "customAltCharacterImage",
              id: "altCharacterImage",
              includeMainCharacter: true,
              position: { x: 0, y: 0 },
              size: {
                maxWidth: CHARACTER_IMAGE_SIZE * 6 + 6 * 5,
                height: CHARACTER_IMAGE_SIZE,
              },
              imageType: "render",
              columns: 6,
              gap: 6,
              alignLastRow: "start",
              justify: "start",
              align: "start",
              flex: { shrink: true, grow: false },
              elementTemplate: {
                type: "group",
                position: { x: 0, y: 0 },
                size: {
                  width: CHARACTER_IMAGE_SIZE,
                  height: CHARACTER_IMAGE_SIZE,
                },
                clip: true,
                clipCornerRadius: 4,
                elements: [
                  {
                    type: "rect",
                    id: "altCharacterBackground",
                    fill: "characterBackground",
                    position: { x: 0, y: 0 },
                    cornerRadius: 4,
                  },
                  {
                    type: "characterImage",
                    id: "altCharacterImage",
                    shadowEnabled: false,
                    cropScaleMultiplier: 1.2,
                    position: { x: 0, y: 0 },
                  },
                  {
                    type: "rect",
                    id: "altCharacterBorder",
                    fill: "transparent",
                    stroke: "characterBorder",
                    strokeWidth: 2,
                    position: { x: 0, y: 0 },
                    cornerRadius: 4,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};

const createMinimalDesign = (playerCount: number): Design => {
  const canvasHeight =
    PADDING_BLOCK * 2 +
    TOURNAMENT_ICON_SIZE +
    PLAYER_SPACING +
    PLAYER_HEIGHT * playerCount +
    PLAYER_SPACING * (playerCount - 1);

  const background: LayerDesign = {
    elements: [
      {
        type: "rect",
        fill: {
          type: "linear",
          angle: 180,
          colorStops: [
            { position: 0, color: "backgroundStart" },
            { position: 1, color: "backgroundEnd" },
          ],
        },
        position: { x: 0, y: 0 },
        size: { width: CANVAS_WIDTH, height: canvasHeight },
      },
    ],
  };

  const tournament: LayerDesign = {
    elements: [
      {
        type: "flexGroup",
        id: "tournamentHeader",
        name: "Tournament Header",
        position: { x: PADDING_INLINE, y: PADDING_BLOCK },
        size: {
          width: CANVAS_WIDTH - PADDING_INLINE * 2,
          height: TOURNAMENT_ICON_SIZE,
        },
        direction: "row",
        align: "center",
        gap: 20,
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
              width:
                CANVAS_WIDTH - PADDING_INLINE * 2 - TOURNAMENT_ICON_SIZE - 20,
              height: TOURNAMENT_ICON_SIZE,
            },
            direction: "column",
            justify: "center",
            gap: 8,
            elements: [
              {
                type: "smartText",
                id: "topRightText",
                name: "Top Right Text",
                position: { x: 0, y: 0 },
                textId: "tournamentInfo",
                fontSize: 24,
                fontWeight: 900,
                fill: "text",
                size: {
                  width:
                    CANVAS_WIDTH -
                    PADDING_INLINE * 2 -
                    TOURNAMENT_ICON_SIZE -
                    20,
                },
                align: "left",
                selectable: true,
              },
              {
                type: "smartText",
                id: "topLeftText",
                name: "Top Left Text",
                textId: "tournamentName",
                fontSize: 44,
                fontWeight: 900,
                fill: "text",
                align: "left",
                position: { x: 0, y: 0 },
                size: {
                  width:
                    CANVAS_WIDTH -
                    PADDING_INLINE * 2 -
                    TOURNAMENT_ICON_SIZE -
                    20,
                },
                selectable: true,
              },
            ],
          },
        ],
      },
    ],
  };

  const players = Array.from({ length: playerCount }, (_, index) => ({
    id: `player-${index}`,
    name: `Player ${index + 1}`,
    position: {
      x: PADDING_INLINE,
      y:
        PADDING_BLOCK +
        TOURNAMENT_ICON_SIZE +
        PLAYER_SPACING +
        index * (PLAYER_HEIGHT + PLAYER_SPACING),
    },
    size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
  }));

  return {
    name: "Minimal",
    author: "@chikyunojin",
    canvasSize: {
      width: CANVAS_WIDTH,
      height: canvasHeight,
    },
    canvasDisplayScale: 0.25,
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
    dynamicPlayerHeight: {
      rowHeight: CHARACTER_IMAGE_SIZE,
      gap: 6,
      maxPerRow: 6,
    },
  };
};

export const minimalDesign = createMinimalDesign(8);
export const minimal4Design = createMinimalDesign(4);
export const minimal16Design = createMinimalDesign(16);
export const minimal24Design = createMinimalDesign(24);

export { createMinimalDesign };
