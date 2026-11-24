import {
  Design,
  ElementConfig,
  LayerDesign,
  PlayerDesign,
  Point,
} from "@/types/top8/Design";
import { TeamMember } from "@/types/top8/Player";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";
import { baselineShift } from "@/utils/top8/baselineShift";

// Doubles. A programme page: the winning pair standing together on a panel
// of one colour, and the other teams listed beside them, two names to a row.
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const HERO_WIDTH = 780;
const HERO_PAD = 56;

const LIST_X = 860;
const LIST_WIDTH = CANVAS_WIDTH - LIST_X - 60;
const LIST_Y = 236;
const ROW_HEIGHT = 110;
const ROW_COUNT = 7;
const LIST_BOTTOM = LIST_Y + ROW_COUNT * ROW_HEIGHT;

const p = (x: number, y: number): Point => ({ x, y });

const colorPalette: Design["colorPalette"] = {
  paper: { color: "rgb(243, 238, 228)", name: "Paper", group: "Background" },
  panel: { color: "rgb(214, 64, 40)", name: "Panel", group: "Background" },
  panelDeep: {
    color: "rgb(188, 48, 28)",
    name: "Panel Numeral",
    group: "Background",
  },
  ink: { color: "rgb(23, 23, 26)", name: "Ink", group: "Text" },
  accent: { color: "rgb(214, 64, 40)", name: "Accent", group: "Text" },
  muted: { color: "rgb(128, 120, 106)", name: "Details", group: "Text" },
  onPanel: { color: "rgb(250, 246, 238)", name: "On Panel", group: "Text" },
  onPanelMuted: {
    color: "rgb(255, 205, 190)",
    name: "On Panel Details",
    group: "Text",
  },
  line: { color: "rgb(206, 198, 182)", name: "Rules", group: "Background" },
  chipA: { color: "rgb(226, 218, 202)", name: "Portrait 1", group: "Player" },
  chipB: { color: "rgb(204, 196, 180)", name: "Portrait 2", group: "Player" },
};

const placeholders = (member: TeamMember) =>
  member === "teammate"
    ? {
        tag: DesignPlaceholder.TEAMMATE_TAG,
        prefix: DesignPlaceholder.TEAMMATE_PREFIX,
        country: DesignPlaceholder.TEAMMATE_COUNTRY,
      }
    : {
        tag: DesignPlaceholder.PLAYER_TAG,
        prefix: DesignPlaceholder.PLAYER_PREFIX,
        country: DesignPlaceholder.PLAYER_COUNTRY,
      };

/** One player's line: sponsor, tag, flag, then their other characters. */
const nameLine = (
  member: TeamMember,
  position: Point,
  width: number,
  sizes: { height: number; prefix: number; tag: number; icon: number },
  fills: { prefix: string; tag: string },
): ElementConfig => {
  const { tag, prefix, country } = placeholders(member);
  const flagHeight = Math.round(sizes.icon * 0.68);

  return {
    type: "flexGroup",
    id: `${member}Line`,
    position,
    size: { width, height: sizes.height },
    direction: "row",
    align: "center",
    gap: Math.round(sizes.tag * 0.36),
    elements: [
      {
        type: "smartText",
        id: `${member}Prefix`,
        text: prefix,
        conditions: [prefix],
        // Shrinks along with the tag, so a long sponsor cannot push the
        // name out of the line.
        flex: { shrink: true },
        fontSize: sizes.prefix,
        fontWeight: 500,
        fill: fills.prefix,
        verticalAlign: "middle",
        position: p(0, baselineShift(sizes.prefix, sizes.tag)),
        size: { height: sizes.height },
      },
      {
        type: "smartText",
        id: `${member}Tag`,
        text: tag,
        fontSize: sizes.tag,
        fontWeight: 800,
        fill: fills.tag,
        verticalAlign: "middle",
        position: p(0, 0),
        size: { height: sizes.height },
        flex: { shrink: true },
      },
      {
        type: "playerFlag",
        member,
        conditions: [country],
        position: p(0, 0),
        size: { width: Math.round(flagHeight * 1.45), height: flagHeight },
        fillMode: "contain",
      },
      {
        type: "customAltCharacterImage",
        member,
        position: p(0, 0),
        size: { height: sizes.icon, maxWidth: sizes.icon * 4 },
        gap: 4,
        elementTemplate: {
          type: "characterImage",
          position: p(0, 0),
          size: { width: sizes.icon, height: sizes.icon },
        },
      },
    ],
  };
};

const HERO_NAME_Y = 850;
const HERO_LINE = 86;

/** A full-length render standing on the panel's floor line. */
const figure = (
  member: TeamMember,
  x: number,
  y: number,
  width: number,
): ElementConfig => ({
  type: "characterImage",
  member,
  uncropped: true,
  shadowEnabled: false,
  align: "bottom",
  position: p(x, y),
  size: { width, height: HERO_NAME_Y - 26 - y },
});

const heroElements: ElementConfig[] = [
  {
    name: "Panel",
    type: "rect",
    fill: "panel",
    position: p(0, 0),
    size: { width: HERO_WIDTH, height: CANVAS_HEIGHT },
  },
  {
    name: "Numeral",
    type: "text",
    text: DesignPlaceholder.PLAYER_PLACEMENT,
    fontSize: 760,
    fontWeight: 800,
    fill: "panelDeep",
    align: "right",
    position: p(0, -40),
    size: { width: HERO_WIDTH - 10 },
  },
  // The teammate stands half a step behind.
  figure("teammate", 300, 190, 500),
  figure("player", -20, 130, 520),
  nameLine(
    "player",
    p(HERO_PAD, HERO_NAME_Y),
    HERO_WIDTH - 2 * HERO_PAD,
    { height: HERO_LINE, prefix: 34, tag: 72, icon: 46 },
    { prefix: "onPanelMuted", tag: "onPanel" },
  ),
  nameLine(
    "teammate",
    p(HERO_PAD, HERO_NAME_Y + HERO_LINE + 6),
    HERO_WIDTH - 2 * HERO_PAD,
    { height: HERO_LINE, prefix: 34, tag: 72, icon: 46 },
    { prefix: "onPanelMuted", tag: "onPanel" },
  ),
];

const PORTRAIT = 86;
const PORTRAIT_X = 100;
const PORTRAIT_STEP = 66;
const NAMES_X = PORTRAIT_X + PORTRAIT_STEP + PORTRAIT + 28;
const LINE_HEIGHT = 46;

/** A round close-up, ringed in paper so the two overlap cleanly. */
const portrait = (
  member: TeamMember,
  x: number,
  fill: string,
): ElementConfig => {
  const size = { width: PORTRAIT, height: PORTRAIT };
  const ring = 5;

  return {
    type: "group",
    id: `${member}Portrait`,
    ...(member === "teammate" && {
      conditions: [DesignPlaceholder.TEAMMATE_TAG],
    }),
    position: p(x, (ROW_HEIGHT - PORTRAIT) / 2),
    size,
    elements: [
      {
        type: "rect",
        fill: "paper",
        cornerRadius: PORTRAIT,
        position: p(-ring, -ring),
        size: { width: PORTRAIT + 2 * ring, height: PORTRAIT + 2 * ring },
      },
      {
        type: "group",
        position: p(0, 0),
        size,
        clip: true,
        clipCornerRadius: PORTRAIT / 2,
        elements: [
          { type: "rect", fill, position: p(0, 0), size },
          {
            type: "characterImage",
            member,
            shadowEnabled: false,
            cropScaleMultiplier: 1.15,
            position: p(0, 0),
            size,
          },
        ],
      },
    ],
  };
};

const rowElements: ElementConfig[] = [
  {
    name: "Rule",
    type: "rect",
    fill: "line",
    position: p(0, 0),
    size: { width: LIST_WIDTH, height: 2 },
  },
  {
    name: "Placement",
    type: "smartText",
    text: DesignPlaceholder.PLAYER_PLACEMENT,
    fontSize: 64,
    fontWeight: 800,
    fill: "accent",
    verticalAlign: "middle",
    position: p(4, 0),
    size: { width: 80, height: ROW_HEIGHT },
  },
  portrait("teammate", PORTRAIT_X + PORTRAIT_STEP, "chipB"),
  portrait("player", PORTRAIT_X, "chipA"),
  ...(["player", "teammate"] as const).map((member, index) =>
    nameLine(
      member,
      p(NAMES_X, ROW_HEIGHT / 2 - LINE_HEIGHT + 1 + index * LINE_HEIGHT),
      LIST_WIDTH - NAMES_X,
      { height: LINE_HEIGHT, prefix: 22, tag: 34, icon: 30 },
      { prefix: "muted", tag: "ink" },
    ),
  ),
];

const basePlayer: PlayerDesign = {
  position: p(0, 0),
  size: { width: LIST_WIDTH, height: ROW_HEIGHT },
  scale: { x: 1, y: 1 },
  elements: rowElements,
};

const players: Partial<PlayerDesign>[] = [
  {
    position: p(0, 0),
    size: { width: HERO_WIDTH, height: CANVAS_HEIGHT },
    elements: heroElements,
  },
  ...Array.from({ length: ROW_COUNT }, (_, index) => ({
    position: p(LIST_X, LIST_Y + index * ROW_HEIGHT),
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
      id: "backgroundImage",
      type: "backgroundImage",
      conditions: [RenderCondition.BACKGROUND_IMG],
      position: p(0, 0),
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      fillMode: "cover",
    },
  ],
};

/** Small spaced capitals: the details under the title. */
const detail = {
  textTransform: "uppercase",
  fontSize: 24,
  fontWeight: 600,
  letterSpacing: 4,
} as const;

const ICON_SIZE = 54;
const FOOTER_MIDDLE = LIST_BOTTOM + (CANVAS_HEIGHT - LIST_BOTTOM) / 2;

const tournament: LayerDesign = {
  elements: [
    {
      type: "smartText",
      id: "heroLabelText",
      name: "Winners Label",
      textId: "heroLabelText",
      ...detail,
      fill: "onPanel",
      position: p(HERO_PAD, 54),
      size: { width: 420, height: 30 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "titleText",
      name: "Title",
      textId: "titleText",
      fontSize: 84,
      fontWeight: 800,
      fill: "ink",
      verticalAlign: "middle",
      position: p(LIST_X, 40),
      size: { width: LIST_WIDTH, height: 104 },
      selectable: true,
    },
    {
      type: "rect",
      name: "Title Rule",
      fill: "ink",
      position: p(LIST_X, 156),
      size: { width: LIST_WIDTH, height: 5 },
    },
    {
      type: "smartText",
      id: "detailsText",
      name: "Details",
      textId: "detailsText",
      ...detail,
      fill: "ink",
      position: p(LIST_X, 180),
      size: { width: LIST_WIDTH - 260, height: 30 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "entrantsText",
      name: "Entrants",
      textId: "entrantsText",
      ...detail,
      fill: "accent",
      anchor: "topRight",
      align: "right",
      position: p(LIST_X + LIST_WIDTH, 180),
      size: { width: 250, height: 30 },
      selectable: true,
    },
    {
      type: "rect",
      name: "List Rule",
      fill: "line",
      position: p(LIST_X, LIST_BOTTOM),
      size: { width: LIST_WIDTH, height: 2 },
    },
    {
      type: "smartText",
      id: "urlText",
      name: "URL",
      textId: "urlText",
      fontSize: 22,
      fontWeight: 500,
      fill: "muted",
      anchor: "leftMiddle",
      position: p(LIST_X, FOOTER_MIDDLE),
      size: { width: LIST_WIDTH - ICON_SIZE - 20, height: 30 },
      selectable: true,
    },
    {
      type: "tournamentIcon",
      id: "tournamentIcon",
      name: "Tournament Icon",
      conditions: [RenderCondition.TOURNAMENT_ICON],
      position: p(
        LIST_X + LIST_WIDTH - ICON_SIZE,
        FOOTER_MIDDLE - ICON_SIZE / 2,
      ),
      size: { width: ICON_SIZE, height: ICON_SIZE },
      fillMode: "contain",
    },
  ],
};

export const duetDesign: Design = {
  name: "Duet",
  canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasDisplayScale: 0.5,
  colorPalette,
  textPalette: {
    heroLabelText: { text: "Doubles Champions", name: "Winners Label" },
    titleText: { text: DesignPlaceholder.TOURNAMENT_NAME, name: "Title" },
    detailsText: {
      text: `${DesignPlaceholder.TOURNAMENT_DATE} · ${DesignPlaceholder.TOURNAMENT_CITY}, ${DesignPlaceholder.TOURNAMENT_COUNTRY}`,
      name: "Details",
    },
    entrantsText: {
      text: `${DesignPlaceholder.ENTRANTS} Teams`,
      name: "Entrants",
    },
    urlText: { text: DesignPlaceholder.TOURNAMENT_URL, name: "URL" },
  },
  background,
  tournament,
  basePlayer,
  players,
};
