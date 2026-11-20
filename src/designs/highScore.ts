import {
  Design,
  ElementConfig,
  LayerDesign,
  PlayerDesign,
} from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

// An arcade cabinet's high-score screen: the standings as a table of glowing
// rows, one colour per placement, with the winner on a card beside it and
// scanlines over the lot.
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const MARGIN = 90;

// The champion card, right of the table.
const CARD_WIDTH = 375;
const CARD_HEIGHT = 618;
const CARD_X = CANVAS_WIDTH - MARGIN - CARD_WIDTH;
const CARD_Y = 318;
const CARD_PAD = 22;
const CARD_INNER = CARD_WIDTH - 2 * CARD_PAD;

// The table: a header line, then one row per player.
const TABLE_X = MARGIN;
const TABLE_WIDTH = CARD_X - 75 - TABLE_X;
const HEADER_Y = 306;
const HEADER_HEIGHT = 44;
const ROW_Y = HEADER_Y + HEADER_HEIGHT;
const ROW_HEIGHT = 74;
const ROW_COUNT = 8;

const COLUMN_GAP = 18;
const ICON_GAP = 8;
const ROW_ICON = 54;

/** Room for `count` character icons side by side. */
const iconsWidth = (count: number, iconSize: number) =>
  count * iconSize + (count - 1) * ICON_GAP;

// The columns are sized from the players in them. Team and Country are left
// out when nobody has one. Fighters is as wide as the most characters anyone
// plays, up to four icons; past that the extra ones shrink into a grid. Name
// gets the width of the longest name first and then everything left over, so
// Fighters only narrows when a long name needs the room.
const playerTable: Design["playerTable"] = {
  width: TABLE_WIDTH,
  gap: COLUMN_GAP,
  columns: [
    { id: "rank", width: 156 },
    { id: "team", width: { min: 96, max: 170 }, optional: true },
    { id: "name", width: { min: 240, max: 640 }, grow: true },
    {
      id: "fighters",
      // One icon each sits in the middle of the column, under the header.
      align: "center",
      width: {
        min: iconsWidth(2, ROW_ICON) + COLUMN_GAP,
        max: iconsWidth(4, ROW_ICON) + COLUMN_GAP,
      },
    },
    { id: "country", width: 168, optional: true },
  ],
};

// Tied placements share a colour.
const ROW_COLORS = [
  "rank1",
  "rank2",
  "rank3",
  "rank4",
  "rank5",
  "rank5",
  "rank7",
  "rank7",
];

const p = (x: number, y: number) => ({ x, y });

const TRANSPARENT = "rgba(0, 0, 0, 0)";

const colorPalette: Design["colorPalette"] = {
  screen: { color: "rgb(3, 3, 11)", name: "Screen", group: "Screen" },
  screenGlow: { color: "rgb(26, 16, 64)", name: "Glow", group: "Screen" },
  panel: { color: "rgb(10, 10, 34)", name: "Card", group: "Screen" },
  title: { color: "rgb(255, 225, 77)", name: "Title", group: "Text" },
  titleShadow: { color: "rgb(226, 59, 138)", name: "Shadow", group: "Text" },
  label: { color: "rgb(255, 77, 109)", name: "Labels", group: "Text" },
  hud: { color: "rgb(255, 255, 255)", name: "Details", group: "Text" },
  header: { color: "rgb(138, 138, 168)", name: "Headers", group: "Text" },
  frame: { color: "rgb(92, 242, 255)", name: "Card Frame", group: "Text" },
  rank1: { color: "rgb(255, 225, 77)", name: "1st", group: "Rows" },
  rank2: { color: "rgb(92, 242, 255)", name: "2nd", group: "Rows" },
  rank3: { color: "rgb(255, 107, 214)", name: "3rd", group: "Rows" },
  rank4: { color: "rgb(125, 255, 122)", name: "4th", group: "Rows" },
  rank5: { color: "rgb(255, 154, 77)", name: "5th", group: "Rows" },
  rank7: { color: "rgb(176, 140, 255)", name: "7th", group: "Rows" },
};

/** A halo in `color` around whatever it is spread onto. */
const glow = (color: string, blur: number) =>
  ({
    shadowColor: color,
    shadowBlur: blur,
    shadowOffset: { x: 0, y: 0 },
    shadowOpacity: 1,
  }) as const;

/** The hard offset shadow of arcade lettering. */
const dropShadow = (offset: number) =>
  ({
    shadowColor: "titleShadow",
    shadowBlur: 0,
    shadowOffset: { x: offset, y: offset },
    shadowOpacity: 1,
  }) as const;

/** The player's characters: the main one, then the others. The first
 *  `fullSize` others are drawn as large as the main one; any more and they
 *  shrink into a grid that takes up the same room. */
const fighters = (iconSize: number, fullSize = 2): ElementConfig[] => [
  {
    type: "characterImage",
    id: "character",
    imageType: "stock",
    position: p(0, 0),
    size: { width: iconSize, height: iconSize },
    fillMode: "contain",
    shadowEnabled: false,
  },
  {
    type: "customAltCharacterImage",
    id: "altCharacters",
    conditions: [RenderCondition.HAS_ALT_CHARACTERS],
    position: p(0, 0),
    size: { maxWidth: iconsWidth(fullSize, iconSize), height: iconSize },
    // In a column narrower than its characters, the grid gives up the width.
    flex: { shrink: true },
    gap: ICON_GAP,
    align: "center",
    alignLastRow: "start",
    elementTemplate: {
      type: "characterImage",
      position: p(0, 0),
      size: { width: iconSize, height: iconSize },
    },
  },
];

/** One line of the table. */
const rowElements = (color: string): ElementConfig[] => {
  // A column sets its cells' x and width.
  const cell = (column: string, fontSize: number) =>
    ({
      type: "smartText",
      column,
      fontSize,
      fill: color,
      // The font has one weight; a stroke in the fill's colour thickens it.
      stroke: color,
      strokeWidth: fontSize / 36,
      verticalAlign: "middle",
      position: p(0, 0),
      size: { height: ROW_HEIGHT },
      ...glow(color, 16),
    }) as const;

  return [
    {
      ...cell("rank", 42),
      id: "placementText",
      text: `${DesignPlaceholder.PLAYER_PLACEMENT}${DesignPlaceholder.PLAYER_PLACEMENT_SUFFIX}`,
      textTransform: "uppercase",
    },
    {
      ...cell("team", 34),
      id: "prefixText",
      text: DesignPlaceholder.PLAYER_PREFIX,
      conditions: [DesignPlaceholder.PLAYER_PREFIX],
      textTransform: "uppercase",
      opacity: 0.75,
    },
    {
      ...cell("name", 52),
      id: "tagText",
      text: DesignPlaceholder.PLAYER_TAG,
      textTransform: "uppercase",
      // A name too long for the widest the column gets is cut, not shrunk.
      overflow: "ellipsis",
    },
    {
      type: "flexGroup",
      id: "fighters",
      column: "fighters",
      position: p(0, 0),
      size: { height: ROW_HEIGHT },
      direction: "row",
      align: "center",
      gap: ICON_GAP,
      elements: fighters(ROW_ICON, 3),
    },
    {
      type: "flexGroup",
      id: "country",
      column: "country",
      position: p(0, 0),
      size: { height: ROW_HEIGHT },
      direction: "row",
      align: "center",
      gap: 14,
      elements: [
        {
          type: "playerFlag",
          conditions: [DesignPlaceholder.PLAYER_COUNTRY],
          position: p(0, 0),
          size: { width: 48, height: 33 },
          fillMode: "contain",
        },
        {
          type: "smartText",
          id: "countryText",
          text: DesignPlaceholder.PLAYER_COUNTRY,
          conditions: [DesignPlaceholder.PLAYER_COUNTRY],
          textTransform: "uppercase",
          fontSize: 34,
          fill: color,
          stroke: color,
          strokeWidth: 34 / 36,
          verticalAlign: "middle",
          position: p(0, 0),
          size: { height: ROW_HEIGHT },
          flex: { shrink: true },
          ...glow(color, 16),
        },
      ],
    },
  ];
};

/** The winner's card. These belong to the first player, so they are placed
 *  from that player's row; the card's frame and heading are in the other
 *  layers. */
const championElements = (): ElementConfig[] => {
  const x = CARD_X - TABLE_X + CARD_PAD;
  const y = CARD_Y - ROW_Y;

  return [
    {
      type: "characterImage",
      id: "championRender",
      position: p(x, y + 72),
      size: { width: CARD_INNER, height: 270 },
      fillMode: "contain",
      uncropped: true,
      shadowEnabled: true,
      shadowColor: "titleShadow",
      shadowBlur: 0,
    },
    {
      type: "smartText",
      id: "championTag",
      text: DesignPlaceholder.PLAYER_TAG,
      textTransform: "uppercase",
      fontSize: 56,
      fill: "title",
      stroke: "title",
      strokeWidth: 1.5,
      align: "center",
      verticalAlign: "middle",
      position: p(x, y + 356),
      size: { width: CARD_INNER, height: 66 },
      ...dropShadow(4),
    },
    {
      type: "flexGroup",
      id: "championSponsor",
      position: p(x, y + 430),
      size: { width: CARD_INNER, height: 44 },
      direction: "row",
      align: "center",
      justify: "center",
      gap: 14,
      elements: [
        {
          type: "playerFlag",
          conditions: [DesignPlaceholder.PLAYER_COUNTRY],
          position: p(0, 0),
          size: { width: 44, height: 30 },
          fillMode: "contain",
        },
        {
          type: "smartText",
          id: "championPrefix",
          text: DesignPlaceholder.PLAYER_PREFIX,
          conditions: [DesignPlaceholder.PLAYER_PREFIX],
          textTransform: "uppercase",
          fontSize: 34,
          fill: "frame",
          verticalAlign: "middle",
          position: p(0, 0),
          size: { height: 44 },
          flex: { shrink: true },
          ...glow("frame", 14),
        },
      ],
    },
    {
      type: "flexGroup",
      id: "championFighters",
      position: p(x, y + 490),
      size: { width: CARD_INNER, height: 96 },
      direction: "row",
      align: "center",
      justify: "center",
      gap: ICON_GAP,
      elements: fighters(96),
    },
  ];
};

const playerElements = (index: number): ElementConfig[] => [
  ...rowElements(ROW_COLORS[index]),
  ...(index === 0 ? championElements() : []),
];

const rowPosition = (index: number) => p(TABLE_X, ROW_Y + index * ROW_HEIGHT);

const basePlayer: PlayerDesign = {
  position: rowPosition(0),
  size: { width: TABLE_WIDTH, height: ROW_HEIGHT },
  scale: { x: 1, y: 1 },
  elements: playerElements(0),
};

const players: Design["players"] = Array.from(
  { length: ROW_COUNT },
  (_, index) => ({
    id: `player-${index}`,
    position: rowPosition(index),
    size: { width: TABLE_WIDTH, height: ROW_HEIGHT },
    elements: playerElements(index),
  }),
);

const fullCanvas = {
  position: p(0, 0),
  size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
};

// A few stars. [x, y, size, colour]
const STARS: [number, number, number, string][] = [
  [230, 238, 3, "rgb(255, 255, 255)"],
  [1498, 130, 3, "rgb(153, 204, 255)"],
  [652, 734, 4, "rgb(255, 255, 255)"],
  [1190, 908, 3, "rgb(255, 153, 204)"],
  [1728, 604, 4, "rgb(255, 255, 255)"],
  [116, 950, 3, "rgb(153, 204, 255)"],
  [1010, 290, 3, "rgb(255, 255, 255)"],
  [1380, 262, 3, "rgb(255, 153, 204)"],
];

const background: LayerDesign = {
  elements: [
    { type: "rect", fill: "screen", ...fullCanvas },
    {
      type: "rect",
      fill: {
        type: "radial",
        center: { x: 0.5, y: 0.4 },
        colorStops: [
          { position: 0, color: "screenGlow" },
          { position: 0.7, color: "rgba(26, 16, 64, 0)" },
        ],
      },
      ...fullCanvas,
    },
    ...STARS.map(([x, y, size, fill]): ElementConfig => ({
      type: "rect",
      fill,
      position: p(x, y),
      size: { width: size, height: size },
    })),
    // The card: a lit outer line, a gap, a white inner line.
    {
      type: "rect",
      fill: "screen",
      stroke: "frame",
      strokeWidth: 6,
      position: p(CARD_X - 12, CARD_Y - 12),
      size: { width: CARD_WIDTH + 24, height: CARD_HEIGHT + 24 },
      ...glow("frame", 30),
    },
    {
      type: "rect",
      fill: "panel",
      stroke: "hud",
      strokeWidth: 6,
      position: p(CARD_X, CARD_Y),
      size: { width: CARD_WIDTH, height: CARD_HEIGHT },
    },
  ],
};

const HUD_Y = 40;
const HUD_LINE = 34;
const HUD_WIDTH = 560;

/** A red label over a white value, as in the corners of an arcade screen. */
const hudBlock = (
  id: string,
  x: number,
  align: "left" | "center" | "right",
): ElementConfig[] => [
  {
    type: "smartText",
    id: `${id}Label`,
    textId: `${id}Label`,
    textTransform: "uppercase",
    fontSize: 26,
    fill: "label",
    align,
    verticalAlign: "middle",
    position: p(x, HUD_Y),
    size: { width: HUD_WIDTH, height: HUD_LINE },
    selectable: true,
  },
  {
    type: "smartText",
    id: `${id}Value`,
    textId: `${id}Value`,
    textTransform: "uppercase",
    fontSize: 26,
    fill: "hud",
    align,
    verticalAlign: "middle",
    position: p(x, HUD_Y + HUD_LINE),
    size: { width: HUD_WIDTH, height: HUD_LINE },
    selectable: true,
  },
];

const headerCell = (textId: string, column: string): ElementConfig => ({
  type: "smartText",
  id: textId,
  textId,
  column,
  textTransform: "uppercase",
  fontSize: 22,
  letterSpacing: 2,
  fill: "header",
  verticalAlign: "middle",
  position: p(TABLE_X, HEADER_Y),
  size: { height: HEADER_HEIGHT },
  selectable: true,
});

const tournament: LayerDesign = {
  elements: [
    ...hudBlock("hudLeft", MARGIN, "left"),
    ...hudBlock("hudCenter", (CANVAS_WIDTH - HUD_WIDTH) / 2, "center"),
    ...hudBlock("hudRight", CANVAS_WIDTH - MARGIN - HUD_WIDTH, "right"),
    {
      type: "smartText",
      id: "tournamentNameText",
      textId: "tournamentName",
      textTransform: "uppercase",
      fontSize: 104,
      letterSpacing: 4,
      fill: "title",
      stroke: "title",
      strokeWidth: 4,
      lineJoin: "miter",
      align: "center",
      verticalAlign: "middle",
      position: p(MARGIN, 132),
      size: { width: CANVAS_WIDTH - 2 * MARGIN, height: 130 },
      selectable: true,
      ...dropShadow(8),
    },
    headerCell("headerRank", "rank"),
    headerCell("headerTeam", "team"),
    headerCell("headerName", "name"),
    headerCell("headerFighters", "fighters"),
    headerCell("headerCountry", "country"),
    {
      type: "smartText",
      id: "championHeading",
      textId: "champion",
      textTransform: "uppercase",
      fontSize: 26,
      letterSpacing: 2,
      fill: "title",
      align: "center",
      verticalAlign: "middle",
      position: p(CARD_X + CARD_PAD, CARD_Y + 24),
      size: { width: CARD_INNER, height: 36 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "footerText",
      textId: "footer",
      textTransform: "uppercase",
      fontSize: 26,
      letterSpacing: 2,
      fill: "title",
      align: "center",
      verticalAlign: "middle",
      position: p(MARGIN, CANVAS_HEIGHT - 76),
      size: { width: CANVAS_WIDTH - 2 * MARGIN, height: 36 },
      selectable: true,
      ...glow("title", 14),
    },
    // The tube: scanlines and dark corners over everything.
    {
      type: "pattern",
      pattern: "lines",
      color: "rgb(0, 0, 0)",
      opacity: 0.3,
      spacing: 6,
      weight: 3,
      ...fullCanvas,
    },
    {
      type: "rect",
      fill: {
        type: "radial",
        colorStops: [
          { position: 0.7, color: TRANSPARENT },
          { position: 1, color: "rgba(0, 0, 0, 0.6)" },
        ],
      },
      ...fullCanvas,
    },
  ],
};

export const highScoreDesign: Design = {
  name: "High Score",
  canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasDisplayScale: 0.25,
  colorPalette,
  textPalette: {
    tournamentName: {
      text: `${DesignPlaceholder.TOURNAMENT_NAME}`,
      name: "Tournament Name",
    },
    hudLeftLabel: { text: "Date", name: "Top Left Label" },
    hudLeftValue: {
      text: `${DesignPlaceholder.TOURNAMENT_DATE}`,
      name: "Top Left",
    },
    hudCenterLabel: { text: "Hi-Score", name: "Top Center Label" },
    hudCenterValue: {
      text: `${DesignPlaceholder.ENTRANTS} Entrants`,
      name: "Top Center",
    },
    hudRightLabel: { text: "Stage", name: "Top Right Label" },
    hudRightValue: {
      text: `${DesignPlaceholder.TOURNAMENT_LOCATION}`,
      name: "Top Right",
    },
    headerRank: { text: "Rank", name: "Rank Header" },
    headerTeam: { text: "Team", name: "Team Header" },
    headerName: { text: "Name", name: "Name Header" },
    headerFighters: { text: "Fighters", name: "Fighters Header" },
    headerCountry: { text: "Country", name: "Country Header" },
    champion: { text: "- Champion -", name: "Card Heading" },
    footer: { text: "Insert Coin", name: "Footer" },
  },
  background,
  tournament,
  basePlayer,
  players,
  playerTable,
};
