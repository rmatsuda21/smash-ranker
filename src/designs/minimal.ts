import { Design, LayerDesign, PlayerDesign } from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

const CANVAS_WIDTH = 800;
const PADDING_BLOCK = 12;
const PADDING_INLINE = 12;
const TOURNAMENT_ICON_SIZE = 100;
const PLAYER_SPACING = 8;
const PLAYER_WIDTH = CANVAS_WIDTH - PADDING_INLINE * 2;
const PLAYER_HEIGHT = 68;
const PLAYER_PADDING_BLOCK = 10;
const PLAYER_PADDING_LEFT = 20;
const FLAG_SIZE = 36;
const CHARACTER_IMAGE_SIZE = 48;

export type MinimalTheme = "dark" | "light";

const darkPalette: Design["colorPalette"] = {
  backgroundStart: {
    color: "rgb(25, 25, 25)",
    name: "Gradient Start",
    group: "Background",
  },
  backgroundEnd: {
    color: "rgb(0, 0, 0)",
    name: "Gradient End",
    group: "Background",
  },
  primary: {
    color: "rgba(142, 142, 142, 0.21)",
    name: "Main BG",
    group: "Player",
  },
  characterBackground: {
    color: "rgb(236, 236, 236)",
    name: "Character BG",
    group: "Player",
  },
  characterBorder: {
    color: "rgb(255, 255, 255)",
    name: "Character Border",
    group: "Player",
  },
  text: { color: "rgb(255, 255, 255)", name: "Text", group: "Text" },
  prefixText: { color: "rgb(128, 128, 128)", name: "Prefix", group: "Text" },
};

const lightPalette: Design["colorPalette"] = {
  backgroundStart: {
    color: "rgb(245, 245, 245)",
    name: "Gradient Start",
    group: "Background",
  },
  backgroundEnd: {
    color: "rgb(220, 220, 220)",
    name: "Gradient End",
    group: "Background",
  },
  primary: {
    color: "rgba(0, 0, 0, 0.08)",
    name: "Main BG",
    group: "Player",
  },
  characterBackground: {
    color: "rgb(255, 255, 255)",
    name: "Character BG",
    group: "Player",
  },
  characterBorder: {
    color: "rgb(40, 40, 40)",
    name: "Character Border",
    group: "Player",
  },
  text: { color: "rgb(20, 20, 20)", name: "Text", group: "Text" },
  prefixText: { color: "rgb(120, 120, 120)", name: "Prefix", group: "Text" },
};

const palettes: Record<MinimalTheme, Design["colorPalette"]> = {
  dark: darkPalette,
  light: lightPalette,
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
      position: { x: PLAYER_PADDING_LEFT, y: PLAYER_PADDING_BLOCK },
      size: {
        width: PLAYER_WIDTH - PLAYER_PADDING_LEFT - PLAYER_PADDING_BLOCK,
        height: PLAYER_HEIGHT,
      },
      direction: "row",
      justify: "center",
      gap: 20,
      elements: [
        {
          type: "smartText",
          text: DesignPlaceholder.PLAYER_PLACEMENT,
          fontSize: 40,
          fontWeight: 900,
          fill: "text",
          align: "left",
          verticalAlign: "middle",
          position: { x: 0, y: -3 },
          size: { width: 30, height: CHARACTER_IMAGE_SIZE },
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
          position: { x: 0, y: -6 },
          size: { height: 45 },
          direction: "row",
          align: "end",
          gap: 3,
          conditions: [DesignPlaceholder.PLAYER_PREFIX],
          flex: { grow: true },
          elements: [
            {
              type: "smartText",
              text: `${DesignPlaceholder.PLAYER_PREFIX}`,
              id: "fullNameText",
              fontSize: 18,
              verticalAlign: "bottom",
              fontWeight: 900,
              fill: "prefixText",
              position: { x: 0, y: 0 },
            },
            {
              type: "smartText",
              text: `${DesignPlaceholder.PLAYER_TAG}`,
              id: "tagText",
              fontSize: 28,
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
          fontSize: 28,
          align: "left",
          verticalAlign: "bottom",
          fontWeight: 900,
          fill: "text",
          position: { x: 0, y: -6 },
          size: { height: 45 },
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

const createMinimalDesign = (
  playerCount: number,
  theme: MinimalTheme = "dark",
): Design => {
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
                fontSize: 40,
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
    colorPalette: palettes[theme],
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

export const minimalDarkDesign = createMinimalDesign(8, "dark");
export const minimal4DarkDesign = createMinimalDesign(4, "dark");
export const minimalLightDesign = createMinimalDesign(8, "light");
export const minimal4LightDesign = createMinimalDesign(4, "light");

export { createMinimalDesign };
