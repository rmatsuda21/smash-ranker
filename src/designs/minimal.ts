import { Design, LayerDesign, PlayerDesign } from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";
import { baselineShift } from "@/utils/top8/baselineShift";

const CANVAS_WIDTH = 800;
const PADDING_BLOCK = 28;
const PADDING_INLINE = 32;
const TOURNAMENT_ICON_SIZE = 100;
const HEADER_GAP = 24;
const PLAYER_SPACING = 8;
const PLAYER_WIDTH = CANVAS_WIDTH - PADDING_INLINE * 2;
const PLAYER_HEIGHT = 68;
const PLAYER_PADDING_BLOCK = 10;
const PLACEMENT_WIDTH = 44;
const FLAG_SIZE = 36;
const CHARACTER_IMAGE_SIZE = 48;
const CHARACTER_RADIUS = 8;
const TAG_FONT_SIZE = 28;
const PREFIX_FONT_SIZE = 22;

export type MinimalTheme = "dark" | "light";

const darkPalette: Design["colorPalette"] = {
  backgroundStart: {
    color: "rgb(24, 24, 27)",
    name: "Gradient Start",
    group: "Background",
  },
  backgroundEnd: {
    color: "rgb(12, 12, 14)",
    name: "Gradient End",
    group: "Background",
  },
  divider: {
    color: "rgba(255, 255, 255, 0.1)",
    name: "Divider",
    group: "Player",
  },
  characterBackground: {
    color: "rgba(255, 255, 255, 0.08)",
    name: "Character BG",
    group: "Player",
  },
  characterBorder: {
    color: "rgba(255, 255, 255, 0.14)",
    name: "Character Border",
    group: "Player",
  },
  text: { color: "rgb(245, 245, 245)", name: "Text", group: "Text" },
  mutedText: {
    color: "rgb(150, 150, 156)",
    name: "Secondary Text",
    group: "Text",
  },
};

const lightPalette: Design["colorPalette"] = {
  backgroundStart: {
    color: "rgb(251, 251, 250)",
    name: "Gradient Start",
    group: "Background",
  },
  backgroundEnd: {
    color: "rgb(240, 240, 238)",
    name: "Gradient End",
    group: "Background",
  },
  divider: {
    color: "rgba(0, 0, 0, 0.1)",
    name: "Divider",
    group: "Player",
  },
  characterBackground: {
    color: "rgba(0, 0, 0, 0.05)",
    name: "Character BG",
    group: "Player",
  },
  characterBorder: {
    color: "rgba(0, 0, 0, 0.12)",
    name: "Character Border",
    group: "Player",
  },
  text: { color: "rgb(24, 24, 27)", name: "Text", group: "Text" },
  mutedText: {
    color: "rgb(120, 120, 126)",
    name: "Secondary Text",
    group: "Text",
  },
};

const palettes: Record<MinimalTheme, Design["colorPalette"]> = {
  dark: darkPalette,
  light: lightPalette,
};

const basePlayer: PlayerDesign = {
  position: { x: PADDING_INLINE, y: 190 },
  size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
  scale: { x: 1, y: 1 },
  // A ledger: no card behind the row, just a hairline above it. Placement
  // and prefix are quiet so the name carries the row.
  elements: [
    {
      type: "rect",
      id: "divider",
      fill: "divider",
      position: { x: 0, y: -PLAYER_SPACING / 2 - 1 },
      size: { width: PLAYER_WIDTH, height: 2 },
    },
    {
      type: "flexGroup",
      id: "main",
      name: "Main",
      position: { x: 0, y: PLAYER_PADDING_BLOCK },
      size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
      direction: "row",
      gap: 16,
      elements: [
        {
          type: "smartText",
          text: DesignPlaceholder.PLAYER_PLACEMENT,
          fontSize: 32,
          fontWeight: 800,
          fill: "mutedText",
          align: "center",
          verticalAlign: "middle",
          position: { x: 0, y: 0 },
          size: { width: PLACEMENT_WIDTH, height: CHARACTER_IMAGE_SIZE },
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
          size: { height: CHARACTER_IMAGE_SIZE },
          direction: "row",
          align: "center",
          gap: 8,
          conditions: [DesignPlaceholder.PLAYER_PREFIX],
          flex: { grow: true },
          elements: [
            {
              type: "smartText",
              text: `${DesignPlaceholder.PLAYER_PREFIX}`,
              id: "fullNameText",
              fontSize: PREFIX_FONT_SIZE,
              fontWeight: 500,
              fill: "mutedText",
              verticalAlign: "middle",
              // Smaller than the tag, so shifted onto its baseline.
              position: {
                x: 0,
                y: baselineShift(PREFIX_FONT_SIZE, TAG_FONT_SIZE),
              },
              size: { height: CHARACTER_IMAGE_SIZE },
            },
            {
              type: "smartText",
              text: DesignPlaceholder.PLAYER_TAG,
              id: "tagText",
              fontSize: TAG_FONT_SIZE,
              fontWeight: 700,
              fill: "text",
              verticalAlign: "middle",
              position: { x: 0, y: 0 },
              size: { height: CHARACTER_IMAGE_SIZE },
              flex: { shrink: true },
            },
          ],
        },
        {
          type: "smartText",
          text: DesignPlaceholder.PLAYER_TAG,
          id: "tagText",
          fontSize: TAG_FONT_SIZE,
          fontWeight: 700,
          fill: "text",
          verticalAlign: "middle",
          position: { x: 0, y: 0 },
          size: { height: CHARACTER_IMAGE_SIZE },
          conditions: [RenderCondition.NOT, DesignPlaceholder.PLAYER_PREFIX],
          align: "left",
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
                clipCornerRadius: CHARACTER_RADIUS,
                elements: [
                  {
                    type: "rect",
                    id: "altCharacterBackground",
                    fill: "characterBackground",
                    position: { x: 0, y: 0 },
                    cornerRadius: CHARACTER_RADIUS,
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
                    cornerRadius: CHARACTER_RADIUS,
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

const DEFAULT_PLAYER_COUNT = 8;
const MAX_PLAYER_COUNT = 32;

// Built with the default number of rows. The count is changed afterwards in
// the Players tab (`dynamicPlayerCount`, `resizePlayerSlots`).
const createMinimalDesign = (theme: MinimalTheme): Design => {
  const playerCount = DEFAULT_PLAYER_COUNT;
  const canvasHeight =
    PADDING_BLOCK * 2 +
    TOURNAMENT_ICON_SIZE +
    HEADER_GAP +
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
            gap: 10,
            elements: [
              {
                type: "smartText",
                id: "topLeftText",
                name: "Top Left Text",
                textId: "tournamentName",
                fontSize: 38,
                fontWeight: 800,
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
              {
                type: "smartText",
                id: "topRightText",
                name: "Top Right Text",
                position: { x: 0, y: 0 },
                textId: "tournamentInfo",
                fontSize: 20,
                fontWeight: 500,
                fill: "mutedText",
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
        HEADER_GAP +
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
    dynamicPlayerCount: {
      slotPitch: PLAYER_HEIGHT + PLAYER_SPACING,
      min: 1,
      max: MAX_PLAYER_COUNT,
    },
  };
};

export const minimalDarkDesign = createMinimalDesign("dark");
export const minimalLightDesign = createMinimalDesign("light");
