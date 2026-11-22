import {
  Design,
  ElementConfig,
  LayerDesign,
  PlayerDesign,
} from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

// A record sleeve: the winner in one colour on a flat panel, their name in
// tall black capitals under it, and everyone else as a track listing.
const CANVAS_WIDTH = 1440;
const CANVAS_HEIGHT = 1730;

const PANEL_HEIGHT = 960;
const PAD = 64;
const INNER = CANVAS_WIDTH - 2 * PAD;

const p = (x: number, y: number) => ({ x, y });

const colorPalette: Design["colorPalette"] = {
  panel: { color: "rgb(27, 95, 170)", name: "Panel", group: "Sleeve" },
  paper: { color: "rgb(242, 235, 221)", name: "Paper", group: "Sleeve" },
  ink: { color: "rgb(18, 18, 18)", name: "Ink", group: "Sleeve" },
  accent: { color: "rgb(242, 160, 30)", name: "Accent", group: "Sleeve" },
  muted: { color: "rgb(79, 74, 66)", name: "Details", group: "Text" },
  line: { color: "rgb(201, 192, 174)", name: "Rules", group: "Text" },
};

/** Small spaced capitals: credits and labels. */
const credit = {
  textTransform: "uppercase",
  fontSize: 22,
  fontWeight: 500,
  letterSpacing: 4,
} as const;

const flagBox = (
  size: { width: number; height: number },
  border: string,
): ElementConfig => ({
  type: "group",
  id: "flag",
  conditions: [DesignPlaceholder.PLAYER_COUNTRY],
  position: p(0, 0),
  size,
  elements: [
    { type: "playerFlag", position: p(0, 0), size, fillMode: "cover" },
    {
      type: "rect",
      fill: "rgba(0, 0, 0, 0)",
      stroke: border,
      strokeWidth: 2,
      position: p(0, 0),
      size,
    },
  ],
});

/** Side of the square the winner's close-up is framed in. */
const HERO_FRAME = 1150;
/** Where the winner's face lands on the panel. */
const HERO_FOCUS = p(930, 520);
/** The name is set in a regular-width face squeezed to a poster condensed. */
const NAME_SQUEEZE = 0.64;
const NAME_WIDTH = 930;
const NAME_TOP = PANEL_HEIGHT + 27;
const RULE_Y = 1330;
const HERO_ICON = 44;

const HERO_PREFIX = 64;
const HERO_TAG = 320;

/** What a winner without a sponsor gives back: the sponsor's line and the
 *  air over it. */
const SPONSOR_BAND = 69;
/** Where the tag starts when it is alone: just under the panel, so that
 *  with the band taken out it still sits on the rule. */
const NAME_TOP_ALONE = RULE_Y - 6 - SPONSOR_BAND - HERO_TAG;

const NAME_LINE_OVERLAP = 47;

/** The winner's name, squeezed as one block. */
const nameBlock = (hasPrefix: boolean): ElementConfig => ({
  type: "group",
  id: hasPrefix ? "name" : "nameNoPrefix",
  conditions: hasPrefix
    ? [DesignPlaceholder.PLAYER_PREFIX]
    : [RenderCondition.NOT, DesignPlaceholder.PLAYER_PREFIX],
  position: p(PAD, hasPrefix ? NAME_TOP : NAME_TOP_ALONE),
  scale: { x: NAME_SQUEEZE, y: 1 },
  elements: [
    {
      type: "flexGroup",
      id: "nameStack",
      position: p(0, 0),
      size: {
        width: NAME_WIDTH / NAME_SQUEEZE,
        height: hasPrefix ? RULE_Y - 6 - NAME_TOP : HERO_TAG,
      },
      direction: "column",
      justify: "end",
      align: "start",
      // The lines' boxes overlap: the font leaves a lot of air over its
      // capitals, which would otherwise sit between sponsor and tag.
      gap: -NAME_LINE_OVERLAP,
      elements: [
        {
          type: "smartText",
          id: "prefixText",
          text: DesignPlaceholder.PLAYER_PREFIX,
          conditions: [DesignPlaceholder.PLAYER_PREFIX],
          textTransform: "uppercase",
          fontSize: HERO_PREFIX,
          fontWeight: 900,
          fill: "ink",
          position: p(0, 0),
          size: { width: NAME_WIDTH / NAME_SQUEEZE },
        },
        {
          type: "smartText",
          id: "tagText",
          text: DesignPlaceholder.PLAYER_TAG,
          textTransform: "uppercase",
          fontSize: HERO_TAG,
          fontWeight: 900,
          fill: "ink",
          position: p(-10, 0),
          size: { width: NAME_WIDTH / NAME_SQUEEZE },
        },
      ],
    },
  ],
});

const heroElements = (): ElementConfig[] => [
  {
    // A close-up in one colour: grey art let through at part strength, so
    // the panel tints it. The crop's square is drawn at twice the size
    // with the art scaled back by half, so only the panel's edges cut it.
    type: "characterImage",
    id: "character",
    position: p(HERO_FOCUS.x - HERO_FRAME, HERO_FOCUS.y - HERO_FRAME),
    size: { width: 2 * HERO_FRAME, height: 2 * HERO_FRAME },
    cropScaleMultiplier: 0.5,
    fillMode: "contain",
    shadowEnabled: false,
    tone: { grayscale: true, contrast: 1.25 },
    opacity: 0.6,
    clip: true,
  },
  {
    type: "flexGroup",
    id: "badges",
    position: p(PAD, PANEL_HEIGHT - 56 - HERO_ICON),
    size: { width: 700, height: HERO_ICON },
    direction: "row",
    align: "center",
    gap: 12,
    elements: [
      flagBox({ width: 60, height: 40 }, "paper"),
      {
        type: "customAltCharacterImage",
        id: "altCharacters",
        conditions: [RenderCondition.HAS_ALT_CHARACTERS],
        position: p(0, 0),
        size: { maxWidth: 600, height: HERO_ICON },
        gap: 10,
        elementTemplate: {
          type: "characterImage",
          position: p(0, 0),
          size: { width: HERO_ICON, height: HERO_ICON },
        },
      },
    ],
  },
  // Sponsor over tag, sitting on the rule. Without a sponsor its line is
  // taken out of the poster (`collapsibleBand`), and the tag sits that much
  // higher with it.
  nameBlock(true),
  nameBlock(false),
];

const COLUMN_GAP = 64;
const ROW_WIDTH = (INNER - COLUMN_GAP) / 2;
const LIST_TOP = RULE_Y + 6;
const ROWS = 4;
const ROW_HEIGHT = (CANVAS_HEIGHT - 44 - LIST_TOP) / ROWS;
const ROW_ICON = 48;
const ROW_ICON_GAP = 6;

/** A line of the track listing: number, sponsor over tag, the player's
 *  characters, flag. The name takes what the rest leaves. */
const rowElements = (): ElementConfig[] => [
  {
    type: "flexGroup",
    id: "row",
    position: p(0, 0),
    size: { width: ROW_WIDTH, height: ROW_HEIGHT },
    direction: "row",
    align: "center",
    gap: 18,
    elements: [
      {
        type: "smartText",
        id: "placementText",
        text: `0${DesignPlaceholder.PLAYER_PLACEMENT}`,
        fontSize: 24,
        fontWeight: 500,
        letterSpacing: 1,
        fill: "muted",
        verticalAlign: "middle",
        position: p(0, 0),
        size: { width: 50, height: ROW_HEIGHT },
      },
      {
        type: "flexGroup",
        id: "nameStack",
        position: p(0, 0),
        size: { width: 0, height: ROW_HEIGHT },
        direction: "column",
        justify: "center",
        stretch: true,
        flex: { grow: true, shrink: true },
        elements: [
          {
            type: "smartText",
            id: "prefixText",
            text: DesignPlaceholder.PLAYER_PREFIX,
            conditions: [DesignPlaceholder.PLAYER_PREFIX],
            textTransform: "uppercase",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 0.5,
            minFontSize: 14,
            fill: "ink",
            position: p(0, 0),
          },
          {
            type: "smartText",
            id: "tagText",
            text: DesignPlaceholder.PLAYER_TAG,
            textTransform: "uppercase",
            fontSize: 38,
            fontWeight: 700,
            letterSpacing: 0.5,
            minFontSize: 20,
            fill: "ink",
            position: p(0, 0),
          },
        ],
      },
      // Main character first, then the others, all the same size; past six
      // they shrink into a grid in the same room.
      {
        type: "customAltCharacterImage",
        id: "characters",
        includeMainCharacter: true,
        position: p(0, 0),
        size: {
          maxWidth: 6 * ROW_ICON + 5 * ROW_ICON_GAP,
          height: ROW_ICON,
        },
        gap: ROW_ICON_GAP,
        elementTemplate: {
          type: "characterImage",
          position: p(0, 0),
          size: { width: ROW_ICON, height: ROW_ICON },
        },
      },
      flagBox({ width: 48, height: 32 }, "ink"),
    ],
  },
  {
    type: "rect",
    id: "rule",
    fill: "line",
    position: p(0, ROW_HEIGHT - 2),
    size: { width: ROW_WIDTH, height: 2 },
  },
];

const basePlayer: PlayerDesign = {
  position: p(0, 0),
  size: { width: CANVAS_WIDTH, height: PANEL_HEIGHT },
  scale: { x: 1, y: 1 },
  elements: heroElements(),
};

// The winner, then the listing: four down the left column, three down the
// right.
const players: Design["players"] = [
  {
    id: "player-0",
    position: p(0, 0),
    size: { width: CANVAS_WIDTH, height: PANEL_HEIGHT },
    elements: heroElements(),
  },
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `player-${i + 1}`,
    position: p(
      PAD + Math.floor(i / ROWS) * (ROW_WIDTH + COLUMN_GAP),
      LIST_TOP + (i % ROWS) * ROW_HEIGHT,
    ),
    size: { width: ROW_WIDTH, height: ROW_HEIGHT },
    elements: rowElements(),
  })),
];

const background: LayerDesign = {
  elements: [
    {
      type: "rect",
      fill: "paper",
      position: p(0, 0),
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    },
    {
      type: "rect",
      fill: "panel",
      position: p(0, 0),
      size: { width: CANVAS_WIDTH, height: PANEL_HEIGHT },
    },
  ],
};

const ICON_SIZE = 80;
const ICON_SPACE = ICON_SIZE + 24;
const TITLE_WIDTH = 700;

/** The tournament's name in the panel's top corner, on up to a few lines.
 *  It starts further right when the icon is there. */
const title = (hasIcon: boolean): ElementConfig => ({
  type: "text",
  id: hasIcon ? "tournamentNameText" : "tournamentNameTextNoIcon",
  textId: "tournamentName",
  conditions: hasIcon
    ? [RenderCondition.TOURNAMENT_ICON]
    : [RenderCondition.NOT, RenderCondition.TOURNAMENT_ICON],
  ...credit,
  maxHeight: 110,
  fill: "paper",
  position: p(PAD + (hasIcon ? ICON_SPACE : 0), 54),
  size: { width: TITLE_WIDTH },
  selectable: true,
});

const DETAILS_WIDTH = 340;
const DETAILS_LINE = 38;

const detail = (
  id: string,
  textId: string,
  condition: DesignPlaceholder,
): ElementConfig => ({
  type: "smartText",
  id,
  textId,
  conditions: [condition],
  ...credit,
  letterSpacing: 3.5,
  fill: "muted",
  align: "right",
  verticalAlign: "middle",
  position: p(0, 0),
  size: { width: DETAILS_WIDTH, height: DETAILS_LINE },
  selectable: true,
});

const tournament: LayerDesign = {
  elements: [
    {
      type: "group",
      id: "icon",
      conditions: [RenderCondition.TOURNAMENT_ICON],
      position: p(PAD, 48),
      elements: [
        {
          type: "rect",
          fill: "paper",
          position: p(0, 0),
          size: { width: ICON_SIZE, height: ICON_SIZE },
        },
        {
          type: "tournamentIcon",
          position: p(4, 4),
          size: { width: ICON_SIZE - 8, height: ICON_SIZE - 8 },
          fillMode: "contain",
        },
      ],
    },
    title(true),
    title(false),
    {
      type: "smartText",
      id: "badgeText",
      textId: "badge",
      ...credit,
      fill: "paper",
      align: "right",
      position: p(CANVAS_WIDTH - PAD - 400, 76),
      size: { width: 400, height: 30 },
      selectable: true,
    },
    // On the panel, over the winner's flag and characters.
    {
      type: "rect",
      id: "accentBar",
      fill: "accent",
      position: p(PAD, 770),
      size: { width: 128, height: 12 },
    },
    {
      type: "smartText",
      id: "championLabelText",
      textId: "championLabel",
      ...credit,
      fill: "paper",
      position: p(PAD, 808),
      size: { width: 600, height: 30 },
      selectable: true,
    },
    // Credits beside the winner's name, sitting on the rule; a line with
    // nothing to show drops out.
    {
      type: "flexGroup",
      id: "details",
      position: p(CANVAS_WIDTH - PAD - DETAILS_WIDTH, NAME_TOP),
      size: { width: DETAILS_WIDTH, height: RULE_Y - 40 - NAME_TOP },
      direction: "column",
      justify: "end",
      align: "end",
      elements: [
        detail("eventText", "eventName", DesignPlaceholder.EVENT_NAME),
        detail("entrantsText", "entrants", DesignPlaceholder.ENTRANTS),
        detail("cityText", "city", DesignPlaceholder.TOURNAMENT_CITY),
        detail("dateText", "date", DesignPlaceholder.TOURNAMENT_DATE),
      ],
    },
    {
      type: "rect",
      id: "rule",
      fill: "ink",
      position: p(PAD, RULE_Y),
      size: { width: INNER, height: 6 },
    },
  ],
};

export const sleeveDesign: Design = {
  name: "Sleeve",
  canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasDisplayScale: 0.25,
  colorPalette,
  textPalette: {
    tournamentName: {
      text: `${DesignPlaceholder.TOURNAMENT_NAME}`,
      name: "Tournament Name",
    },
    badge: { text: "TOP 8", name: "Badge" },
    championLabel: { text: "01 · CHAMPION", name: "Champion Label" },
    eventName: { text: `${DesignPlaceholder.EVENT_NAME}`, name: "Event" },
    entrants: {
      text: `${DesignPlaceholder.ENTRANTS} Entrants`,
      name: "Entrants",
    },
    city: { text: `${DesignPlaceholder.TOURNAMENT_CITY}`, name: "City" },
    date: { text: `${DesignPlaceholder.TOURNAMENT_DATE}`, name: "Date" },
  },
  background,
  tournament,
  basePlayer,
  players,
  // The sponsor line over the winner's name. Everything from the credits
  // and the rule down closes up when there is no sponsor.
  collapsibleBand: {
    y: PANEL_HEIGHT,
    height: SPONSOR_BAND,
    conditions: [DesignPlaceholder.PLAYER_PREFIX],
  },
};
