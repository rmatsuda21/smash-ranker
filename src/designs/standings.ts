import {
  Design,
  ElementConfig,
  LayerDesign,
  PlayerDesign,
} from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";
import { baselineShift } from "@/utils/top8/baselineShift";

const CANVAS_WIDTH = 900;
const PADDING_INLINE = 56;
const CONTENT_WIDTH = CANVAS_WIDTH - PADDING_INLINE * 2;

const TOP_BAR_HEIGHT = 12;
const HEADER_TOP = 54;
const HEADER_HEIGHT = 262;
const HEADER_GAP = 14;
// Wide enough for a banner; a square icon is centred in it.
const HEADER_IMAGE_HEIGHT = 136;
const PLAYERS_TOP = HEADER_TOP + HEADER_HEIGHT + 24;
// The last row has its own padding under the icons, so this is small.
const PADDING_BOTTOM = 20;

const ICON_SIZE = 56;
const ROW_PADDING_BLOCK = 12;
const ROW_HEIGHT = ICON_SIZE + ROW_PADDING_BLOCK * 2;
const ROW_SPACING = 6;
const PLACEMENT_WIDTH = 76;
// Where the flag starts. Wrapped lines of characters start here too.
const CONTENT_LEFT = PLACEMENT_WIDTH + 16;
const CONTENT_RIGHT = 20;
const CONTENT_GAP = 10;
const FLAG_WIDTH = 44;
// Prefix and tag together. Leaves room for the flag and one character on
// the first line; a longer name shrinks to fit.
const NAME_MAX_WIDTH =
  CONTENT_WIDTH -
  CONTENT_LEFT -
  CONTENT_RIGHT -
  FLAG_WIDTH -
  ICON_SIZE -
  CONTENT_GAP * 2;
const TAG_FONT_SIZE = 34;
const PREFIX_FONT_SIZE = 30;
export type StandingsTheme = "light" | "dark";

const lightPalette: Design["colorPalette"] = {
  backgroundStart: {
    color: "rgb(247, 244, 237)",
    name: "Gradient Start",
    group: "Background",
  },
  backgroundEnd: {
    color: "rgb(238, 233, 222)",
    name: "Gradient End",
    group: "Background",
  },
  accent: { color: "rgb(226, 54, 54)", name: "Accent", group: "Accent" },
  onAccent: {
    color: "rgb(255, 255, 255)",
    name: "Text on Accent",
    group: "Accent",
  },
  divider: {
    color: "rgba(24, 24, 28, 0.12)",
    name: "Divider",
    group: "Player",
  },
  characterBackground: {
    color: "rgb(226, 220, 206)",
    name: "Character BG",
    group: "Player",
  },
  characterBorder: {
    color: "rgba(24, 24, 28, 0.16)",
    name: "Character Border",
    group: "Player",
  },
  text: { color: "rgb(24, 24, 28)", name: "Text", group: "Text" },
  mutedText: { color: "rgb(132, 126, 114)", name: "Muted", group: "Text" },
};

const darkPalette: Design["colorPalette"] = {
  backgroundStart: {
    color: "rgb(24, 25, 29)",
    name: "Gradient Start",
    group: "Background",
  },
  backgroundEnd: {
    color: "rgb(13, 14, 16)",
    name: "Gradient End",
    group: "Background",
  },
  accent: { color: "rgb(255, 198, 53)", name: "Accent", group: "Accent" },
  onAccent: {
    color: "rgb(20, 20, 22)",
    name: "Text on Accent",
    group: "Accent",
  },
  divider: {
    color: "rgba(255, 255, 255, 0.12)",
    name: "Divider",
    group: "Player",
  },
  characterBackground: {
    color: "rgb(44, 46, 52)",
    name: "Character BG",
    group: "Player",
  },
  characterBorder: {
    color: "rgba(255, 255, 255, 0.18)",
    name: "Character Border",
    group: "Player",
  },
  text: { color: "rgb(244, 244, 242)", name: "Text", group: "Text" },
  mutedText: { color: "rgb(142, 144, 150)", name: "Muted", group: "Text" },
};

const palettes: Record<StandingsTheme, Design["colorPalette"]> = {
  light: lightPalette,
  dark: darkPalette,
};

type RowStyle = {
  /** A filled band behind the whole row. */
  band: boolean;
  /** A hairline between this row and the one above. */
  divider: boolean;
  placementFill: string;
  textFill: string;
  prefixFill: string;
};

const createPlayerElements = (style: RowStyle): ElementConfig[] => [
  ...(style.band
    ? [
        {
          type: "rect",
          id: "band",
          fill: "accent",
          position: { x: 0, y: 0 },
          // Same height as the player, so it grows with wrapped rows.
          size: { width: CONTENT_WIDTH, height: ROW_HEIGHT },
          cornerRadius: 16,
        } satisfies ElementConfig,
      ]
    : []),
  ...(style.divider
    ? [
        {
          type: "rect",
          id: "divider",
          fill: "divider",
          position: { x: 0, y: -ROW_SPACING / 2 - 1 },
          size: { width: CONTENT_WIDTH, height: 2 },
        } satisfies ElementConfig,
      ]
    : []),
  {
    type: "smartText",
    id: "placement",
    text: DesignPlaceholder.PLAYER_PLACEMENT,
    fontSize: 46,
    fontWeight: 900,
    fill: style.placementFill,
    align: "center",
    verticalAlign: "middle",
    position: { x: 0, y: ROW_PADDING_BLOCK },
    size: { width: PLACEMENT_WIDTH, height: ICON_SIZE },
  },
  {
    // Flag, name and characters share one line and wrap as a unit: a
    // character that doesn't fit starts a new line under the flag.
    type: "flexGroup",
    id: "content",
    position: { x: CONTENT_LEFT, y: ROW_PADDING_BLOCK },
    size: {
      width: CONTENT_WIDTH - CONTENT_LEFT - CONTENT_RIGHT,
      height: ICON_SIZE,
    },
    direction: "row",
    align: "center",
    gap: CONTENT_GAP,
    wrap: true,
    elements: [
      {
        type: "playerFlag",
        position: { x: 0, y: 0 },
        size: { width: FLAG_WIDTH, height: 34 },
        conditions: [DesignPlaceholder.PLAYER_COUNTRY],
        fillMode: "contain",
      },
      {
        type: "flexGroup",
        id: "nameGroup",
        position: { x: 0, y: 0 },
        size: { height: ICON_SIZE, maxWidth: NAME_MAX_WIDTH },
        direction: "row",
        align: "center",
        gap: CONTENT_GAP,
        elements: [
          {
            type: "smartText",
            id: "prefixText",
            text: DesignPlaceholder.PLAYER_PREFIX,
            conditions: [DesignPlaceholder.PLAYER_PREFIX],
            fontSize: PREFIX_FONT_SIZE,
            fontWeight: 500,
            fill: style.prefixFill,
            verticalAlign: "middle",
            // Smaller than the tag, so shifted onto its baseline.
            position: {
              x: 0,
              y: baselineShift(PREFIX_FONT_SIZE, TAG_FONT_SIZE),
            },
            size: { height: ICON_SIZE },
            flex: { shrink: true },
          },
          {
            type: "smartText",
            id: "tagText",
            text: DesignPlaceholder.PLAYER_TAG,
            fontSize: TAG_FONT_SIZE,
            fontWeight: 800,
            fill: style.textFill,
            verticalAlign: "middle",
            position: { x: 0, y: 0 },
            size: { height: ICON_SIZE },
            flex: { shrink: true },
          },
        ],
      },
      {
        type: "customAltCharacterImage",
        id: "characters",
        inline: true,
        includeMainCharacter: true,
        imageType: "render",
        position: { x: 0, y: 0 },
        elementTemplate: {
          type: "group",
          position: { x: 0, y: 0 },
          size: { width: ICON_SIZE, height: ICON_SIZE },
          clip: true,
          clipCornerRadius: 12,
          elements: [
            {
              type: "rect",
              id: "characterBackground",
              fill: "characterBackground",
              position: { x: 0, y: 0 },
              cornerRadius: 12,
            },
            {
              type: "characterImage",
              id: "characterImage",
              shadowEnabled: false,
              cropScaleMultiplier: 1.2,
              position: { x: 0, y: 0 },
            },
            {
              type: "rect",
              id: "characterBorder",
              fill: "transparent",
              stroke: "characterBorder",
              strokeWidth: 3,
              position: { x: 0, y: 0 },
              cornerRadius: 12,
            },
          ],
        },
      },
    ],
  },
];

// 1st place sits on an accent band, 2nd and 3rd get accent numerals, and
// everyone below is plain with a hairline between rows.
const firstElements = createPlayerElements({
  band: true,
  divider: false,
  placementFill: "onAccent",
  textFill: "onAccent",
  prefixFill: "onAccent",
});
const podiumElements = (divider: boolean) =>
  createPlayerElements({
    band: false,
    divider,
    placementFill: "accent",
    textFill: "text",
    prefixFill: "mutedText",
  });
const secondElements = podiumElements(false);
const thirdElements = podiumElements(true);
const restElements = createPlayerElements({
  band: false,
  divider: true,
  placementFill: "mutedText",
  textFill: "text",
  prefixFill: "mutedText",
});

const basePlayer: PlayerDesign = {
  position: { x: PADDING_INLINE, y: PLAYERS_TOP },
  size: { width: CONTENT_WIDTH, height: ROW_HEIGHT },
  scale: { x: 1, y: 1 },
  elements: restElements,
};

const SLOT_ELEMENTS = [firstElements, secondElements, thirdElements];

const createStandingsDesign = (
  playerCount: number,
  theme: StandingsTheme = "light",
): Design => {
  const canvasHeight =
    PLAYERS_TOP +
    ROW_HEIGHT * playerCount +
    ROW_SPACING * (playerCount - 1) +
    PADDING_BOTTOM;

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
      {
        type: "rect",
        id: "topBar",
        fill: "accent",
        position: { x: 0, y: 0 },
        size: { width: CANVAS_WIDTH, height: TOP_BAR_HEIGHT },
      },
    ],
  };

  const tournament: LayerDesign = {
    elements: [
      {
        type: "flexGroup",
        id: "tournamentHeader",
        name: "Tournament Header",
        position: { x: PADDING_INLINE, y: HEADER_TOP },
        size: { width: CONTENT_WIDTH, height: HEADER_HEIGHT },
        direction: "column",
        align: "center",
        // From the top, so the name stays put when there is no image and the
        // players move up into its space (`tournamentIconSpace`).
        justify: "start",
        gap: HEADER_GAP,
        elements: [
          {
            type: "tournamentIcon",
            id: "tournamentIcon",
            name: "Tournament Icon",
            position: { x: 0, y: -6 },
            size: { width: CONTENT_WIDTH, height: HEADER_IMAGE_HEIGHT },
            conditions: [RenderCondition.TOURNAMENT_ICON],
            fillMode: "contain",
            align: "center",
          },
          {
            type: "smartText",
            id: "tournamentNameText",
            name: "Tournament Name",
            textId: "tournamentName",
            fontSize: 46,
            fontWeight: 900,
            fill: "text",
            align: "center",
            position: { x: 0, y: 0 },
            size: { width: CONTENT_WIDTH },
            selectable: true,
          },
          {
            type: "smartText",
            id: "tournamentInfoText",
            name: "Tournament Info",
            textId: "tournamentInfo",
            fontSize: 22,
            fontWeight: 500,
            fill: "mutedText",
            align: "center",
            position: { x: 0, y: 0 },
            size: { width: CONTENT_WIDTH },
            selectable: true,
          },
          {
            type: "rect",
            id: "headerRule",
            fill: "accent",
            position: { x: 0, y: 8 },
            size: { width: 72, height: 6 },
            cornerRadius: 3,
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
      y: PLAYERS_TOP + index * (ROW_HEIGHT + ROW_SPACING),
    },
    size: { width: CONTENT_WIDTH, height: ROW_HEIGHT },
    ...(SLOT_ELEMENTS[index] ? { elements: SLOT_ELEMENTS[index] } : {}),
  }));

  return {
    name: "Standings",
    canvasSize: { width: CANVAS_WIDTH, height: canvasHeight },
    canvasDisplayScale: 0.25,
    colorPalette: palettes[theme],
    textPalette: {
      tournamentName: {
        text: `${DesignPlaceholder.TOURNAMENT_NAME}`,
        name: "Tournament Name",
      },
      tournamentInfo: {
        text: `${DesignPlaceholder.ENTRANTS} Entrants  ·  ${DesignPlaceholder.TOURNAMENT_LOCATION}  ·  ${DesignPlaceholder.TOURNAMENT_DATE}`,
        name: "Tournament Info",
      },
    },
    background,
    tournament,
    basePlayer,
    players,
    dynamicPlayerHeight: { wrapGroupId: "content" },
    tournamentIconSpace: HEADER_IMAGE_HEIGHT + HEADER_GAP,
  };
};

export const standingsLightDesign = createStandingsDesign(8, "light");
export const standingsDarkDesign = createStandingsDesign(8, "dark");
export const standings16LightDesign = createStandingsDesign(16, "light");

export { createStandingsDesign };
