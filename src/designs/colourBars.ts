import {
  Design,
  ElementConfig,
  LayerDesign,
  PlayerDesign,
} from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

// A test card: eight flat bars of colour side by side, the winner's three
// times as wide as the rest. Names run down the bars; the tournament sits
// on a dark strip along the bottom.
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const FOOTER_HEIGHT = 93;
const BAR_HEIGHT = CANVAS_HEIGHT - FOOTER_HEIGHT;
const HERO_WIDTH = 531;
const BAR_COUNT = 7;
const BAR_WIDTH = (CANVAS_WIDTH - HERO_WIDTH) / BAR_COUNT;
/** The dark hairline between bars. */
const DIVIDER = 2;
/** The dark strip at the foot of each narrow bar, holding the flag. */
const STRIP_HEIGHT = 54;

const PAD = 35;
const LABEL_SIZE = 21;
const WEIGHT = 800;

const p = (x: number, y: number) => ({ x, y });

/** Palette key of each slot's bar. */
const BAR_KEYS = [
  "bar1",
  "bar2",
  "bar3",
  "bar4",
  "bar5",
  "bar6",
  "bar7",
  "bar8",
];

type Rgb = [number, number, number];

/** A set of colours: one per bar in placement order, and the colour of the
 *  lettering on them, which has to read on all eight. */
type Colorway = { bars: Rgb[]; text: Rgb };

const BAR_NAMES = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "5th (2)",
  "7th",
  "7th (2)",
];

const rgb = ([r, g, b]: Rgb) => `rgb(${r}, ${g}, ${b})`;

const createPalette = ({ bars, text }: Colorway): Design["colorPalette"] => ({
  ground: { color: "rgb(17, 17, 17)", name: "Ground", group: "Card" },
  text: { color: rgb(text), name: "Lettering", group: "Bars" },
  title: { color: "rgb(255, 255, 255)", name: "Title", group: "Card" },
  muted: { color: "rgb(184, 184, 184)", name: "Details", group: "Card" },
  ...Object.fromEntries(
    BAR_KEYS.map((key, i) => [
      key,
      { color: rgb(bars[i]), name: BAR_NAMES[i], group: "Bars" },
    ]),
  ),
});

const WHITE: Rgb = [255, 255, 255];
const INK: Rgb = [17, 17, 17];

const COLORWAYS = {
  // Deep, slightly muted colours under white lettering.
  original: {
    bars: [
      [179, 38, 30],
      [31, 79, 181],
      [169, 80, 15],
      [176, 63, 116],
      [74, 103, 43],
      [27, 118, 125],
      [90, 62, 140],
      [133, 100, 0],
    ],
    text: WHITE,
  },
  // A broadcast test pattern: white, then the bright bars in their usual
  // order, under dark lettering.
  signal: {
    bars: [
      [236, 236, 230],
      [238, 214, 30],
      [44, 208, 222],
      [58, 204, 92],
      [226, 92, 214],
      [238, 78, 62],
      [92, 132, 255],
      [176, 176, 170],
    ],
    text: INK,
  },
  // Soft tints under dark lettering.
  pastel: {
    bars: [
      [255, 176, 190],
      [255, 204, 164],
      [255, 232, 158],
      [186, 232, 180],
      [164, 226, 222],
      [170, 208, 250],
      [200, 190, 250],
      [238, 190, 236],
    ],
    text: [38, 30, 62],
  },
  // One red bar for the winner, greys stepping down for the rest.
  mono: {
    bars: [
      [200, 40, 34],
      [96, 96, 100],
      [84, 84, 88],
      [72, 72, 76],
      [62, 62, 66],
      [52, 52, 56],
      [43, 43, 47],
      [35, 35, 39],
    ],
    text: WHITE,
  },
} satisfies Record<string, Colorway>;

/** Small spaced capitals: placements and details. */
const label = {
  textTransform: "uppercase",
  fontSize: LABEL_SIZE,
  fontWeight: 500,
  letterSpacing: 3,
  fill: "text",
} as const;

const placementLabel: ElementConfig = {
  type: "smartText",
  id: "placementText",
  text: `0${DesignPlaceholder.PLAYER_PLACEMENT}`,
  ...label,
  position: p(0, 0),
};

/** A character's head icon on a dark square. */
const fighterChip = (size: number): ElementConfig => ({
  type: "group",
  position: p(0, 0),
  size: { width: size, height: size },
  elements: [
    {
      type: "rect",
      fill: "ground",
      position: p(0, 0),
      size: { width: size, height: size },
    },
    {
      type: "characterImage",
      position: p(size * 0.13, size * 0.13),
      size: { width: size * 0.74, height: size * 0.74 },
    },
  ],
});

const HERO_CHIP = 38;
const HERO_FLAG = { width: 38, height: 26 };
const HERO_INNER = HERO_WIDTH - 2 * PAD;

/** Side of the square the winner's close-up is framed in. */
const HERO_FRAME = 700;

/** The winner: name across the top, a close-up of the fighter below it, flag and other characters in the bottom corner. */
const heroElements = (): ElementConfig[] => [
  {
    type: "rect",
    id: "bar",
    fill: BAR_KEYS[0],
    position: p(0, 0),
    size: { width: HERO_WIDTH, height: BAR_HEIGHT },
  },
  {
    // A close-up on the face, the same way as on the narrow bars: the
    // crop's square at twice the size with the art scaled back by half, so
    // the square's own edges never cut the art. The face lands in the
    // middle of the bar's lower half; the bar's edges cut the rest.
    type: "characterImage",
    id: "character",
    position: p(
      HERO_WIDTH / 2 - HERO_FRAME,
      BAR_HEIGHT - HERO_FRAME / 2 - HERO_FRAME,
    ),
    size: { width: 2 * HERO_FRAME, height: 2 * HERO_FRAME },
    cropScaleMultiplier: 0.5,
    fillMode: "contain",
    shadowEnabled: false,
    clip: true,
  },
  { ...placementLabel, position: p(PAD, 29) },
  {
    type: "flexGroup",
    id: "nameBlock",
    position: p(PAD, 68),
    size: { width: HERO_INNER, height: 190 },
    direction: "column",
    justify: "start",
    align: "start",
    elements: [
      {
        type: "smartText",
        id: "prefixText",
        text: DesignPlaceholder.PLAYER_PREFIX,
        conditions: [DesignPlaceholder.PLAYER_PREFIX],
        fontSize: 35,
        fontWeight: WEIGHT,
        fill: "text",
        position: p(0, 0),
        size: { width: HERO_INNER },
      },
      {
        type: "smartText",
        id: "tagText",
        text: DesignPlaceholder.PLAYER_TAG,
        fontSize: 122,
        fontWeight: WEIGHT,
        letterSpacing: -3,
        fill: "text",
        position: p(-4, 0),
        size: { width: HERO_INNER },
      },
    ],
  },
  {
    type: "flexGroup",
    id: "badges",
    position: p(PAD, BAR_HEIGHT - 26 - HERO_CHIP),
    size: { width: HERO_INNER, height: HERO_CHIP },
    direction: "row",
    align: "center",
    gap: 8,
    elements: [
      {
        type: "group",
        id: "flag",
        conditions: [DesignPlaceholder.PLAYER_COUNTRY],
        position: p(0, 0),
        size: { width: HERO_FLAG.width + 20, height: HERO_CHIP },
        elements: [
          {
            type: "rect",
            fill: "ground",
            position: p(0, 0),
            size: { width: HERO_FLAG.width + 20, height: HERO_CHIP },
          },
          {
            type: "playerFlag",
            position: p(10, (HERO_CHIP - HERO_FLAG.height) / 2),
            size: HERO_FLAG,
            fillMode: "cover",
          },
        ],
      },
      {
        type: "customAltCharacterImage",
        id: "altCharacters",
        conditions: [RenderCondition.HAS_ALT_CHARACTERS],
        position: p(0, 0),
        size: { maxWidth: HERO_INNER - 66, height: HERO_CHIP },
        gap: 8,
        elementTemplate: fighterChip(HERO_CHIP),
      },
    ],
  },
];

const BAR_CHIP = 35;
const BAR_CHIP_GAP = 6;
const BAR_NAME = 64;
const BAR_PREFIX = 21;
/** Where the name starts, and how far down the bar it may run: to just
 *  above the fighter. */
const NAME_TOP = 74;
const NAME_LENGTH = 480;
const BUST = 368;
/** Room across the bar for the name and the sponsor beside it. */
const NAME_STACK = 100;

/** A narrow bar: the name running down it, a close-up of the fighter at the
 *  foot, other characters stacked in the top corner. */
const barElements = (index: number): ElementConfig[] => [
  {
    type: "rect",
    id: "bar",
    fill: BAR_KEYS[index],
    position: p(0, 0),
    size: { width: BAR_WIDTH, height: BAR_HEIGHT },
  },
  {
    // A close-up, standing on the strip. The crops centre each fighter in a
    // square; drawing that square at twice the size with the art scaled
    // back by half leaves the framing alone and keeps the square's top edge
    // well clear of the art, so hair, hats and raised arms are not cut off.
    // The bar's sides and the strip still cut it.
    type: "characterImage",
    id: "character",
    position: p(
      BAR_WIDTH / 2 - BUST,
      BAR_HEIGHT - STRIP_HEIGHT - BUST / 2 - BUST,
    ),
    size: { width: 2 * BUST, height: 2 * BUST },
    cropScaleMultiplier: 0.5,
    fillMode: "contain",
    shadowEnabled: false,
    clip: true,
  },
  { ...placementLabel, position: p(22, 29) },
  // Turned a quarter: the stack's top is the bar's right, so the sponsor
  // runs beside the name, and the name keeps to the bar's left edge
  // whatever size it ends up.
  {
    type: "group",
    id: "name",
    position: p(16 + NAME_STACK, NAME_TOP),
    rotation: 90,
    elements: [
      {
        type: "flexGroup",
        id: "nameStack",
        position: p(0, 0),
        size: { width: NAME_LENGTH, height: NAME_STACK },
        direction: "column",
        justify: "end",
        align: "start",
        gap: 2,
        elements: [
          {
            type: "smartText",
            id: "prefixText",
            text: DesignPlaceholder.PLAYER_PREFIX,
            conditions: [DesignPlaceholder.PLAYER_PREFIX],
            fontSize: BAR_PREFIX,
            fontWeight: WEIGHT,
            minFontSize: 14,
            fill: "text",
            position: p(2, 0),
            size: { width: NAME_LENGTH },
          },
          {
            type: "smartText",
            id: "tagText",
            text: DesignPlaceholder.PLAYER_TAG,
            fontSize: BAR_NAME,
            fontWeight: WEIGHT,
            letterSpacing: -1,
            minFontSize: 30,
            fill: "text",
            position: p(0, 0),
            size: { width: NAME_LENGTH },
          },
        ],
      },
    ],
  },
  {
    type: "customAltCharacterImage",
    id: "altCharacters",
    conditions: [RenderCondition.HAS_ALT_CHARACTERS],
    position: p(BAR_WIDTH - 13 - (2 * BAR_CHIP + BAR_CHIP_GAP), 22),
    size: { width: 2 * BAR_CHIP + BAR_CHIP_GAP, height: NAME_LENGTH + 40 },
    flow: "column",
    rows: 12,
    gap: BAR_CHIP_GAP,
    justify: "end",
    elementTemplate: fighterChip(BAR_CHIP),
  },
  {
    type: "rect",
    id: "strip",
    fill: "ground",
    position: p(0, BAR_HEIGHT - STRIP_HEIGHT),
    size: { width: BAR_WIDTH, height: STRIP_HEIGHT },
  },
  {
    type: "playerFlag",
    id: "flag",
    conditions: [DesignPlaceholder.PLAYER_COUNTRY],
    position: p(22, BAR_HEIGHT - STRIP_HEIGHT + (STRIP_HEIGHT - 26) / 2),
    size: { width: 38, height: 26 },
    fillMode: "cover",
  },
  {
    type: "rect",
    id: "divider",
    fill: "ground",
    position: p(0, 0),
    size: { width: DIVIDER, height: BAR_HEIGHT },
  },
];

const basePlayer: PlayerDesign = {
  position: p(0, 0),
  size: { width: HERO_WIDTH, height: BAR_HEIGHT },
  scale: { x: 1, y: 1 },
  elements: heroElements(),
};

const players: Design["players"] = [
  {
    id: "player-0",
    position: p(0, 0),
    size: { width: HERO_WIDTH, height: BAR_HEIGHT },
    elements: heroElements(),
  },
  ...Array.from({ length: BAR_COUNT }, (_, i) => ({
    id: `player-${i + 1}`,
    position: p(HERO_WIDTH + i * BAR_WIDTH, 0),
    size: { width: BAR_WIDTH, height: BAR_HEIGHT },
    elements: barElements(i + 1),
  })),
];

const background: LayerDesign = {
  elements: [
    {
      type: "rect",
      fill: "ground",
      position: p(0, 0),
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    },
  ],
};

const FOOTER_Y = BAR_HEIGHT;
const ICON_SIZE = 54;
const SWATCH = 22;
const SWATCH_GAP = 5;
const SWATCHES_WIDTH =
  BAR_KEYS.length * SWATCH + (BAR_KEYS.length - 1) * SWATCH_GAP;
const DETAILS_WIDTH = 600;
const DETAILS_LINE = 29;

const detailsLine = (
  id: string,
  textId: string,
  line: number,
): ElementConfig => ({
  type: "smartText",
  id,
  textId,
  ...label,
  fontSize: 18,
  fill: "muted",
  align: "right",
  verticalAlign: "middle",
  position: p(
    CANVAS_WIDTH - PAD - DETAILS_WIDTH,
    FOOTER_Y + FOOTER_HEIGHT / 2 + (line - 1) * DETAILS_LINE,
  ),
  size: { width: DETAILS_WIDTH, height: DETAILS_LINE },
  selectable: true,
});

const tournament: LayerDesign = {
  elements: [
    // On the winner's bar. A tournament layer element so its text can be
    // edited.
    {
      type: "smartText",
      id: "championLabelText",
      textId: "championLabel",
      ...label,
      align: "right",
      position: p(HERO_WIDTH - PAD - 300, 29),
      size: { width: 300, height: LABEL_SIZE + 4 },
      selectable: true,
    },
    // Icon, name, then the bars' colours as a row of swatches. The name
    // shrinks before it pushes the swatches into the details.
    {
      type: "flexGroup",
      id: "footer",
      position: p(PAD, FOOTER_Y),
      size: {
        width: CANVAS_WIDTH - 2 * PAD - DETAILS_WIDTH - 30,
        height: FOOTER_HEIGHT,
      },
      direction: "row",
      align: "center",
      gap: 22,
      elements: [
        {
          type: "tournamentIcon",
          id: "tournamentIcon",
          conditions: [RenderCondition.TOURNAMENT_ICON],
          position: p(0, 0),
          size: { width: ICON_SIZE, height: ICON_SIZE },
          fillMode: "contain",
        },
        {
          type: "smartText",
          id: "tournamentNameText",
          textId: "tournamentName",
          fontSize: 35,
          fontWeight: WEIGHT,
          fill: "title",
          verticalAlign: "middle",
          position: p(0, 0),
          size: { height: FOOTER_HEIGHT },
          flex: { shrink: true },
          selectable: true,
        },
        {
          type: "group",
          id: "swatches",
          position: p(6, (FOOTER_HEIGHT - SWATCH) / 2),
          size: { width: SWATCHES_WIDTH, height: FOOTER_HEIGHT },
          elements: BAR_KEYS.map((key, i): ElementConfig => ({
            type: "rect",
            fill: key,
            position: p(i * (SWATCH + SWATCH_GAP), 0),
            size: { width: SWATCH, height: SWATCH },
          })),
        },
      ],
    },
    detailsLine("detailsTopText", "detailsTop", 0),
    detailsLine("detailsBottomText", "detailsBottom", 1),
  ],
};

const createColourBarsDesign = (name: string, colors: Colorway): Design => ({
  name,
  canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasDisplayScale: 0.25,
  colorPalette: createPalette(colors),
  textPalette: {
    tournamentName: {
      text: `${DesignPlaceholder.TOURNAMENT_NAME}`,
      name: "Tournament Name",
    },
    detailsTop: {
      text: `${DesignPlaceholder.EVENT_NAME} · ${DesignPlaceholder.ENTRANTS} Entrants`,
      name: "Details (Top)",
    },
    detailsBottom: {
      text: `${DesignPlaceholder.TOURNAMENT_CITY} · ${DesignPlaceholder.TOURNAMENT_DATE}`,
      name: "Details (Bottom)",
    },
    championLabel: { text: "CHAMPION", name: "Champion Label" },
  },
  background,
  tournament,
  basePlayer,
  players,
});

export const colourBarsDesign = createColourBarsDesign(
  "Colour Bars",
  COLORWAYS.original,
);
export const colourBarsSignalDesign = createColourBarsDesign(
  "Colour Bars (Signal)",
  COLORWAYS.signal,
);
export const colourBarsPastelDesign = createColourBarsDesign(
  "Colour Bars (Pastel)",
  COLORWAYS.pastel,
);
export const colourBarsMonoDesign = createColourBarsDesign(
  "Colour Bars (Mono)",
  COLORWAYS.mono,
);
