import {
  Design,
  ElementConfig,
  LayerDesign,
  PlayerDesign,
} from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

// A loud poster: yellow halftone ground inside a band of running text, the
// winner on a tall white card, the rest on dark cards with a strip under
// each. Names sit on tilted tabs of tape, the sponsor on a smaller piece
// stuck right above.
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

/** Thickness of the band of text around the canvas. */
const BAND = 45;
const MARGIN = 80;
const GUTTER = 22;

const HERO_WIDTH = 528;
const CONTENT_HEIGHT = CANVAS_HEIGHT - 2 * MARGIN;
const RIGHT_X = MARGIN + HERO_WIDTH + 35;
const RIGHT_WIDTH = CANVAS_WIDTH - MARGIN - RIGHT_X;

const HEADER_HEIGHT = 112;
const ROW_A_Y = MARGIN + HEADER_HEIGHT + GUTTER;
const ROW_A_HEIGHT = 432;
const ROW_B_Y = ROW_A_Y + ROW_A_HEIGHT + GUTTER + 1;
const ROW_B_HEIGHT = CANVAS_HEIGHT - MARGIN - ROW_B_Y;

const TRANSPARENT = "rgba(0, 0, 0, 0)";

const p = (x: number, y: number) => ({ x, y });

const colorPalette: Design["colorPalette"] = {
  ground: { color: "rgb(255, 214, 10)", name: "Ground", group: "Poster" },
  halftone: { color: "rgb(242, 194, 0)", name: "Dots", group: "Poster" },
  ink: { color: "rgb(28, 17, 71)", name: "Ink", group: "Poster" },
  tape: { color: "rgb(255, 79, 94)", name: "Tape", group: "Poster" },
  paper: { color: "rgb(255, 255, 255)", name: "Paper", group: "Poster" },
  strip: { color: "rgb(17, 17, 17)", name: "Strip", group: "Cards" },
};

type CardKind = "hero" | "large" | "small";
type Card = {
  x: number;
  y: number;
  width: number;
  height: number;
  kind: CardKind;
};

/** Everything that depends on a card's size. */
const CARD_STYLE = {
  hero: {
    strip: 83,
    number: 240,
    numberAt: p(22, -6),
    numberStroke: 3.2,
    name: 93,
    minName: 44,
    prefix: 24,
    tabPad: { x: 29, top: 0, bottom: 9 },
    prefixPad: { x: 19, top: 8, bottom: 8 },
    tabLeft: -16,
    tabLift: 96,
    tabOverhang: 22,
    tilt: -3,
    stripText: 35,
    stripPad: 26,
    flag: { width: 67, height: 45 },
    chip: 61,
    chipGap: 6,
    chipRows: 5,
    chipInset: 16,
  },
  large: {
    strip: 74,
    number: 134,
    numberAt: p(16, -3),
    numberStroke: 2.4,
    name: 48,
    minName: 26,
    prefix: 16,
    tabPad: { x: 19, top: 0, bottom: 5 },
    prefixPad: { x: 13, top: 5, bottom: 5 },
    tabLeft: -10,
    tabLift: 6,
    tabOverhang: 6,
    tilt: -2,
    stripText: 30,
    stripPad: 19,
    flag: { width: 58, height: 38 },
    chip: 51,
    chipGap: 6,
    chipRows: 4,
    chipInset: 13,
  },
  small: {
    strip: 61,
    number: 99,
    numberAt: p(13, -3),
    numberStroke: 2.4,
    name: 35,
    minName: 20,
    prefix: 13,
    tabPad: { x: 16, top: 0, bottom: 4 },
    prefixPad: { x: 11, top: 4, bottom: 4 },
    tabLeft: -8,
    tabLift: 4,
    tabOverhang: 6,
    tilt: -2,
    stripText: 26,
    stripPad: 16,
    flag: { width: 48, height: 32 },
    chip: 42,
    chipGap: 5,
    chipRows: 3,
    chipInset: 10,
  },
} as const;

const rowOf = (
  count: number,
  y: number,
  height: number,
  kind: CardKind,
): Card[] => {
  const width = (RIGHT_WIDTH - (count - 1) * GUTTER) / count;
  return Array.from({ length: count }, (_, i) => ({
    x: RIGHT_X + i * (width + GUTTER),
    y,
    width,
    height,
    kind,
  }));
};

const CARDS: Card[] = [
  {
    x: MARGIN,
    y: MARGIN,
    width: HERO_WIDTH,
    height: CONTENT_HEIGHT,
    kind: "hero",
  },
  ...rowOf(3, ROW_A_Y, ROW_A_HEIGHT, "large"),
  ...rowOf(4, ROW_B_Y, ROW_B_HEIGHT, "small"),
];

/** The name on a tilted piece of tape, the sponsor on a smaller piece stuck
 *  on top of it. Each piece is as wide as its own text. */
const nameTab = ({ width, height, kind }: Card): ElementConfig => {
  const style = CARD_STYLE[kind];
  const { tabPad, prefixPad } = style;
  const textWidth = width + style.tabOverhang - style.tabLeft - 2 * tabPad.x;
  // Tall enough for both pieces; they sit at its bottom.
  const stackHeight = style.name + style.prefix + tabPad.top + 60;

  return {
    type: "group",
    id: "nameTab",
    // Pivots on the tape's bottom-left corner, a little above the strip.
    position: p(style.tabLeft, height - style.strip - style.tabLift),
    rotation: style.tilt,
    elements: [
      {
        type: "flexGroup",
        id: "nameStack",
        position: p(tabPad.x, -(stackHeight + tabPad.bottom)),
        size: { width: textWidth, height: stackHeight },
        direction: "column",
        justify: "end",
        align: "start",
        // The sponsor's tape ends where the name's begins. Its own bottom
        // padding keeps the name's tape off its descenders.
        gap: tabPad.top + prefixPad.bottom,
        elements: [
          {
            type: "smartText",
            id: "prefixText",
            text: DesignPlaceholder.PLAYER_PREFIX,
            conditions: [DesignPlaceholder.PLAYER_PREFIX],
            fontSize: style.prefix,
            minFontSize: Math.round(style.prefix * 0.7),
            fill: "paper",
            // Lines its tape up with the name's left edge.
            position: p(prefixPad.x - tabPad.x, 0),
            size: { width: textWidth },
            background: {
              fill: "tape",
              padding: {
                left: prefixPad.x,
                right: prefixPad.x,
                top: prefixPad.top,
                // Runs a little under the name's tape: two edges that only
                // touch leave a hairline once they are tilted.
                bottom: prefixPad.bottom + 3,
              },
            },
          },
          {
            type: "smartText",
            id: "tagText",
            text: DesignPlaceholder.PLAYER_TAG,
            fontSize: style.name,
            minFontSize: style.minName,
            fill: "paper",
            position: p(0, 0),
            size: { width: textWidth },
            background: {
              fill: "tape",
              padding: {
                left: tabPad.x,
                right: tabPad.x,
                top: tabPad.top,
                bottom: tabPad.bottom,
              },
            },
          },
        ],
      },
    ],
  };
};

/** Other characters, as stickers stacked down the card's right edge. */
const fighterChips = ({ width, height, kind }: Card): ElementConfig => {
  const style = CARD_STYLE[kind];
  const isHero = kind === "hero";
  const { chip, chipGap, chipRows, chipInset } = style;
  const boxWidth = 3 * chip + 2 * chipGap;
  const boxHeight = chipRows * chip + (chipRows - 1) * chipGap;
  const border = 3;

  return {
    type: "customAltCharacterImage",
    id: "altCharacters",
    conditions: [RenderCondition.HAS_ALT_CHARACTERS],
    // Top-right on the dark cards; the winner's go bottom-right, beside the
    // name.
    position: p(
      width - chipInset - boxWidth,
      isHero ? height - style.strip - chipInset - boxHeight : chipInset,
    ),
    size: { width: boxWidth, height: boxHeight },
    flow: "column",
    rows: chipRows,
    gap: chipGap,
    justify: "end",
    align: isHero ? "end" : "start",
    alignLastRow: isHero ? "end" : "start",
    elementTemplate: {
      type: "group",
      position: p(0, 0),
      size: { width: chip, height: chip },
      elements: [
        {
          type: "rect",
          fill: "ground",
          stroke: "ink",
          strokeWidth: border,
          position: p(border / 2, border / 2),
          size: { width: chip - border, height: chip - border },
        },
        {
          type: "characterImage",
          position: p(chip * 0.14, chip * 0.14),
          size: { width: chip * 0.72, height: chip * 0.72 },
        },
      ],
    },
  };
};

const cardElements = (card: Card): ElementConfig[] => {
  const { width, height, kind } = card;
  const style = CARD_STYLE[kind];
  const isHero = kind === "hero";
  const panelHeight = height - style.strip;
  const { flag } = style;

  const art: ElementConfig = isHero
    ? {
        // The whole figure, free to spill over the card's sides but cut at
        // the strip.
        type: "characterImage",
        id: "character",
        position: p(-154, 67),
        size: { width: 896, height: 965 },
        uncropped: true,
        fillMode: "contain",
        shadowEnabled: false,
        clip: true,
        clipOffset: { left: MARGIN, right: MARGIN, bottom: -style.strip },
      }
    : {
        // A close-up in a square as wide as the card, standing on the strip
        // with its head above the card's top edge.
        type: "characterImage",
        id: "character",
        position: p(0, panelHeight - width),
        size: { width, height: width },
        fillMode: "contain",
        shadowEnabled: false,
      };

  return [
    {
      type: "rect",
      id: "panel",
      fill: isHero ? "paper" : "ink",
      position: p(0, 0),
      size: { width, height: panelHeight },
    },
    // The placement as hollow numerals behind the fighter.
    {
      type: "smartText",
      id: "placementText",
      text: `0${DesignPlaceholder.PLAYER_PLACEMENT}`,
      fontSize: style.number,
      fill: TRANSPARENT,
      stroke: isHero ? "ink" : "tape",
      strokeWidth: style.numberStroke,
      position: style.numberAt,
    },
    art,
    fighterChips(card),
    nameTab(card),
    {
      type: "rect",
      id: "strip",
      fill: isHero ? "ink" : "strip",
      position: p(0, panelHeight),
      size: { width, height: style.strip },
    },
    // The winner's strip is lettered from the tournament layer, so its text
    // can be edited.
    ...(isHero
      ? []
      : [
          {
            type: "smartText",
            id: "stripText",
            // Two spaces: the font's word space is narrow in capitals.
            text: `${DesignPlaceholder.PLAYER_PLACEMENT}${DesignPlaceholder.PLAYER_PLACEMENT_SUFFIX}  PLACE`,
            textTransform: "uppercase",
            fontSize: style.stripText,
            fill: "ground",
            verticalAlign: "middle",
            position: p(style.stripPad, panelHeight),
            size: {
              width: width - 3 * style.stripPad - flag.width,
              height: style.strip,
            },
          } satisfies ElementConfig,
        ]),
    {
      type: "group",
      id: "flag",
      conditions: [DesignPlaceholder.PLAYER_COUNTRY],
      position: p(
        width - style.stripPad - flag.width,
        panelHeight + (style.strip - flag.height) / 2,
      ),
      elements: [
        {
          type: "playerFlag",
          position: p(0, 0),
          size: flag,
          fillMode: "cover",
        },
        {
          type: "rect",
          fill: TRANSPARENT,
          stroke: "paper",
          strokeWidth: 2.4,
          position: p(0, 0),
          size: flag,
        },
      ],
    },
  ];
};

const basePlayer: PlayerDesign = {
  position: p(CARDS[0].x, CARDS[0].y),
  size: { width: CARDS[0].width, height: CARDS[0].height },
  scale: { x: 1, y: 1 },
  elements: cardElements(CARDS[0]),
};

const players: Design["players"] = CARDS.map((card, index) => ({
  id: `player-${index}`,
  position: p(card.x, card.y),
  size: { width: card.width, height: card.height },
  elements: cardElements(card),
}));

const fullCanvas = {
  position: p(0, 0),
  size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
};

// The running text around the canvas. Each side shows a fixed set of lines
// spread over its length; a line with nothing to show drops out together
// with its dot.
type BandLine = { textId: string; condition?: DesignPlaceholder };
const NAME: BandLine = {
  textId: "tournamentName",
  condition: DesignPlaceholder.TOURNAMENT_NAME,
};
const DATE: BandLine = {
  textId: "date",
  condition: DesignPlaceholder.TOURNAMENT_DATE,
};
const EVENT: BandLine = {
  textId: "eventName",
  condition: DesignPlaceholder.EVENT_NAME,
};
const CITY: BandLine = {
  textId: "city",
  condition: DesignPlaceholder.TOURNAMENT_CITY,
};
const ENTRANTS: BandLine = {
  textId: "entrants",
  condition: DesignPlaceholder.ENTRANTS,
};
/** Always there, so every side has something to hang its dots on. */
const LABEL: BandLine = { textId: "label" };

const BAND_INSET = 28;
const BAND_DOT = 10;

/** One side's text, laid out left to right in a strip `length` long. */
const bandRow = (
  id: string,
  length: number,
  lines: BandLine[],
): ElementConfig => {
  const anchor = lines.indexOf(LABEL);

  const dot = (
    index: number,
    condition?: DesignPlaceholder,
  ): ElementConfig => ({
    type: "rect",
    id: `${id}-dot-${index}`,
    conditions: condition ? [condition] : undefined,
    fill: "tape",
    cornerRadius: BAND_DOT / 2,
    position: p(0, 0),
    size: { width: BAND_DOT, height: BAND_DOT },
  });

  return {
    type: "flexGroup",
    id,
    position: p(BAND_INSET, 0),
    size: { width: length - 2 * BAND_INSET, height: BAND },
    direction: "row",
    align: "center",
    justify: "space-between",
    gap: 24,
    elements: lines.flatMap((line, index): ElementConfig[] => {
      const text: ElementConfig = {
        type: "smartText",
        id: `${id}-${line.textId}`,
        textId: line.textId,
        conditions: line.condition ? [line.condition] : undefined,
        textTransform: "uppercase",
        fontSize: 22,
        letterSpacing: 2.6,
        fill: "ground",
        verticalAlign: "middle",
        position: p(0, 0),
        size: { height: BAND },
        // A side with more text than room shrinks all of it alike.
        flex: { shrink: true },
      };
      // A line's dot is on the side facing the label, and comes and goes
      // with the line.
      if (index < anchor) return [text, dot(index, line.condition)];
      if (index > anchor) return [dot(index, line.condition), text];
      return [text];
    }),
  };
};

const band = (
  position: { x: number; y: number },
  size: { width: number; height: number },
): ElementConfig => ({ type: "rect", fill: "ink", position, size });

const cornerDiamond = (x: number, y: number): ElementConfig => {
  const half = 9;
  const center = BAND / 2;
  return {
    type: "polygon",
    fill: "ground",
    position: p(x, y),
    points: [
      p(center, center - half),
      p(center + half, center),
      p(center, center + half),
      p(center - half, center),
    ],
  };
};

const SIDE_LENGTH = CANVAS_HEIGHT - 2 * BAND;
const TOP_LENGTH = CANVAS_WIDTH - 2 * BAND;

const ICON_SIZE = 93;
const ICON_SPACE = ICON_SIZE + 26;
const HEADER_INFO_WIDTH = 430;
const HEADER_INFO_LINE = 31;
const TITLE_WIDTH = RIGHT_WIDTH - HEADER_INFO_WIDTH - 20;

/** The tournament name, bottom-aligned in the header, on up to a few lines
 *  that shrink to fit. Narrower when the icon is there. */
const title = (hasIcon: boolean): ElementConfig => ({
  type: "text",
  id: hasIcon ? "tournamentNameText" : "tournamentNameTextNoIcon",
  textId: "tournamentName",
  conditions: hasIcon
    ? [RenderCondition.TOURNAMENT_ICON]
    : [RenderCondition.NOT, RenderCondition.TOURNAMENT_ICON],
  fontSize: 64,
  maxHeight: HEADER_HEIGHT,
  fill: "ink",
  verticalAlign: "bottom",
  position: p(RIGHT_X + (hasIcon ? ICON_SPACE : 0), MARGIN),
  size: {
    width: TITLE_WIDTH - (hasIcon ? ICON_SPACE : 0),
    height: HEADER_HEIGHT,
  },
  selectable: true,
});

const headerInfo = (
  id: string,
  textId: string,
  line: number,
): ElementConfig => ({
  type: "smartText",
  id,
  textId,
  textTransform: "uppercase",
  fontSize: 17,
  letterSpacing: 2.7,
  fill: "ink",
  align: "right",
  verticalAlign: "middle",
  position: p(
    RIGHT_X + RIGHT_WIDTH - HEADER_INFO_WIDTH,
    MARGIN + HEADER_HEIGHT - (2 - line) * HEADER_INFO_LINE - 2,
  ),
  size: { width: HEADER_INFO_WIDTH, height: HEADER_INFO_LINE },
  selectable: true,
});

const HERO = CARDS[0];
const HERO_STYLE = CARD_STYLE.hero;

// The band is part of the background so the winner's figure can reach over
// it; its text can be edited in the Texts tab but not picked on the canvas.
const background: LayerDesign = {
  elements: [
    { type: "rect", fill: "ground", ...fullCanvas },
    {
      type: "pattern",
      pattern: "dots",
      color: "halftone",
      spacing: 19,
      weight: 2.7,
      ...fullCanvas,
    },
    band(p(0, 0), { width: CANVAS_WIDTH, height: BAND }),
    band(p(0, CANVAS_HEIGHT - BAND), { width: CANVAS_WIDTH, height: BAND }),
    band(p(0, 0), { width: BAND, height: CANVAS_HEIGHT }),
    band(p(CANVAS_WIDTH - BAND, 0), { width: BAND, height: CANVAS_HEIGHT }),
    cornerDiamond(0, 0),
    cornerDiamond(CANVAS_WIDTH - BAND, 0),
    cornerDiamond(0, CANVAS_HEIGHT - BAND),
    cornerDiamond(CANVAS_WIDTH - BAND, CANVAS_HEIGHT - BAND),
    {
      type: "group",
      id: "bandTop",
      position: p(BAND, 0),
      elements: [bandRow("bandTopRow", TOP_LENGTH, [NAME, DATE, LABEL, CITY])],
    },
    // Reads top to bottom.
    {
      type: "group",
      id: "bandRight",
      position: p(CANVAS_WIDTH, BAND),
      rotation: 90,
      elements: [
        bandRow("bandRightRow", SIDE_LENGTH, [EVENT, LABEL, ENTRANTS]),
      ],
    },
    {
      type: "group",
      id: "bandBottom",
      position: p(BAND, CANVAS_HEIGHT - BAND),
      elements: [
        bandRow("bandBottomRow", TOP_LENGTH, [ENTRANTS, EVENT, LABEL, NAME]),
      ],
    },
    // Reads bottom to top.
    {
      type: "group",
      id: "bandLeft",
      position: p(0, CANVAS_HEIGHT - BAND),
      rotation: -90,
      elements: [bandRow("bandLeftRow", SIDE_LENGTH, [DATE, LABEL, CITY])],
    },
  ],
};

const tournament: LayerDesign = {
  elements: [
    // The tournament's icon as a sticker beside its name.
    {
      type: "group",
      id: "iconSticker",
      conditions: [RenderCondition.TOURNAMENT_ICON],
      position: p(RIGHT_X + 4, MARGIN + HEADER_HEIGHT - ICON_SIZE - 2),
      rotation: -4,
      elements: [
        {
          type: "rect",
          fill: "ink",
          position: p(7, 7),
          size: { width: ICON_SIZE, height: ICON_SIZE },
        },
        {
          type: "rect",
          fill: "paper",
          position: p(0, 0),
          size: { width: ICON_SIZE, height: ICON_SIZE },
        },
        {
          type: "tournamentIcon",
          position: p(5, 5),
          size: { width: ICON_SIZE - 10, height: ICON_SIZE - 10 },
          fillMode: "contain",
        },
      ],
    },
    title(true),
    title(false),
    headerInfo("headerLabelText", "label", 0),
    headerInfo("headerInfoText", "headerInfo", 1),
    // On the winner's card. Tournament layer elements so their text can be
    // edited.
    {
      type: "smartText",
      id: "championNoteText",
      textId: "championNote",
      textTransform: "uppercase",
      fontSize: 17,
      letterSpacing: 3.4,
      fill: "ink",
      position: p(HERO.x + HERO.width - 20, HERO.y + 24),
      rotation: 90,
      size: { width: 300, height: 20 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "championLabelText",
      textId: "championLabel",
      textTransform: "uppercase",
      fontSize: HERO_STYLE.stripText,
      fill: "ground",
      verticalAlign: "middle",
      position: p(
        HERO.x + HERO_STYLE.stripPad,
        HERO.y + HERO.height - HERO_STYLE.strip,
      ),
      size: {
        width: HERO.width - 3 * HERO_STYLE.stripPad - HERO_STYLE.flag.width,
        height: HERO_STYLE.strip,
      },
      selectable: true,
    },
  ],
};

export const tapeDesign: Design = {
  name: "Tape",
  canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasDisplayScale: 0.25,
  colorPalette,
  textPalette: {
    tournamentName: {
      text: `${DesignPlaceholder.TOURNAMENT_NAME}`,
      name: "Tournament Name",
    },
    eventName: { text: `${DesignPlaceholder.EVENT_NAME}`, name: "Event" },
    date: {
      text: `${DesignPlaceholder.TOURNAMENT_DATE_NUMERIC}`,
      name: "Date",
    },
    city: { text: `${DesignPlaceholder.TOURNAMENT_CITY}`, name: "City" },
    entrants: {
      text: `${DesignPlaceholder.ENTRANTS} Entrants`,
      name: "Entrants",
    },
    label: { text: "TOP 8 RESULT", name: "Label" },
    headerInfo: {
      text: `${DesignPlaceholder.EVENT_NAME} · ${DesignPlaceholder.TOURNAMENT_DATE_NUMERIC}`,
      name: "Header Info",
    },
    championNote: { text: "THE CHAMPION", name: "Champion Note" },
    championLabel: { text: "CHAMPION", name: "Champion Label" },
  },
  background,
  tournament,
  basePlayer,
  players,
};
