import { Design, ElementConfig, PlayerDesign } from "@/types/top8/Design";
import { TeamMember } from "@/types/top8/Player";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { baselineShift } from "@/utils/top8/baselineShift";
import {
  KAGARIBI_CARD_GAP,
  KAGARIBI_CARDS,
  kagaribiBackground,
  kagaribiColorPalette,
  kagaribiDesign,
  kagaribiTournament,
} from "@/designs/kagaribi";

// Kagaribi for doubles: the same cards, each holding a team. The player
// stands in front, their teammate a step behind, and the two names share
// the foot of the card.

const p = (x: number, y: number) => ({ x, y });

type Box = { x: number; y: number; width: number; height: number };

/** Where the two characters stand, as shares of the card's size. */
type Staging = { player: Box; teammate: Box };

// Side by side: the player to the left and forward.
const SQUARE_STAGING: Staging = {
  player: { x: -0.2, y: -0.1, width: 0.86, height: 1.1 },
  teammate: { x: 0.33, y: -0.04, width: 0.8, height: 1.02 },
};

// The tall first-place card: one above the other, the teammate lower and
// to the right.
const TALL_STAGING: Staging = {
  player: { x: -0.2, y: -0.07, width: 1.08, height: 0.62 },
  teammate: { x: 0.1, y: 0.36, width: 1.04, height: 0.58 },
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

/**
 * @param w card width
 * @param h card height
 * @param s scale of the lettering and icons
 * @param edge which sides have no neighbour, so the art may run further out
 */
const createPlayerElements = (
  w: number,
  h: number,
  s: number,
  staging: Staging,
  edge: { left?: boolean; top?: boolean } = {},
): ElementConfig[] => {
  const lineHeight = Math.round(46 * s);
  const tagSize = Math.round(34 * s);
  const prefixSize = Math.round(18 * s);
  const iconSize = Math.round(30 * s);
  const flagHeight = Math.round(22 * s);
  const inset = Math.round(14 * s);
  const namesTop = h - Math.round(10 * s) - 2 * lineHeight;

  const character = (member: TeamMember): ElementConfig => {
    const box = staging[member];
    return {
      name: member === "teammate" ? "Teammate Character" : "Character",
      type: "characterImage",
      member,
      shadowEnabled: false,
      position: p(w * box.x, h * box.y),
      size: { width: w * box.width, height: h * box.height },
      // Set back: a little darker than the player in front.
      ...(member === "teammate" && { tone: { brightness: 0.8 } }),
      clip: true,
      clipOffset: {
        top: edge.top ? Math.ceil(h * 0.2) : KAGARIBI_CARD_GAP,
        left: edge.left ? Math.ceil(w * 0.2) : KAGARIBI_CARD_GAP,
      },
    };
  };

  const nameLine = (member: TeamMember, y: number): ElementConfig => {
    const { tag, prefix, country } = placeholders(member);
    return {
      type: "flexGroup",
      id: `${member}Line`,
      position: p(inset, y),
      size: { width: w - 2 * inset, height: lineHeight },
      direction: "row",
      align: "center",
      gap: Math.round(10 * s),
      elements: [
        {
          type: "smartText",
          id: `${member}Prefix`,
          text: prefix,
          conditions: [prefix],
          // Shrinks along with the tag, so a long sponsor cannot push the
          // name out of the line.
          flex: { shrink: true },
          fontSize: prefixSize,
          fontWeight: 400,
          fill: "prefixText",
          verticalAlign: "middle",
          position: p(0, baselineShift(prefixSize, tagSize)),
          size: { height: lineHeight },
        },
        {
          type: "smartText",
          id: `${member}Tag`,
          text: tag,
          fontSize: tagSize,
          fontWeight: 500,
          fill: "text",
          verticalAlign: "middle",
          position: p(0, 0),
          size: { height: lineHeight },
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
          size: { height: iconSize, maxWidth: iconSize * 4 },
          gap: Math.round(4 * s),
          elementTemplate: {
            type: "characterImage",
            position: p(0, 0),
            size: { width: iconSize, height: iconSize },
          },
        },
      ],
    };
  };

  const shadeHeight = 2 * lineHeight + Math.round(90 * s);

  return [
    {
      name: "Card Background",
      type: "rect",
      fill: "cardBg",
      position: p(0, 0),
      size: { width: w, height: h },
    },
    {
      name: "Left Border",
      type: "rect",
      fill: "leftBorder",
      position: p(0, 0),
      size: { width: 5, height: h },
    },
    character("teammate"),
    character("player"),
    {
      name: "Bottom Gradient",
      type: "rect",
      fill: {
        type: "linear",
        angle: 180,
        colorStops: [
          { position: 0, color: "rgba(0, 0, 0, 0)" },
          { position: 0.6, color: "rgba(0, 0, 0, 0.8)" },
          { position: 1, color: "rgba(0, 0, 0, 0.9)" },
        ],
      },
      position: p(0, h - shadeHeight),
      size: { width: w, height: shadeHeight },
    },
    {
      name: "Placement",
      type: "text",
      text: DesignPlaceholder.PLAYER_PLACEMENT,
      fontSize: Math.round(80 * s),
      fontWeight: 500,
      fill: "text",
      stroke: "placementStroke",
      strokeWidth: Math.round(2 * s),
      shadowBlur: Math.round(8 * s),
      shadowColor: "placementShadow",
      shadowOffset: { x: Math.round(3 * s), y: Math.round(3 * s) },
      position: p(Math.round(15 * s), Math.round(8 * s)),
    },
    nameLine("player", namesTop),
    nameLine("teammate", namesTop + lineHeight),
  ];
};

const [first, ...rest] = KAGARIBI_CARDS;
const TOP_ROW = rest.slice(0, 3);
const BOTTOM_ROW = rest.slice(3);

const slot = (
  card: (typeof KAGARIBI_CARDS)[number],
  s: number,
  staging: Staging,
  edge?: { left?: boolean; top?: boolean },
): PlayerDesign => ({
  position: p(card.x, card.y),
  size: { width: card.width, height: card.height },
  scale: { x: 1, y: 1 },
  elements: createPlayerElements(card.width, card.height, s, staging, edge),
});

const bottomElements = createPlayerElements(
  BOTTOM_ROW[0].width,
  BOTTOM_ROW[0].height,
  0.82,
  SQUARE_STAGING,
);

const basePlayer: PlayerDesign = {
  position: p(0, 0),
  size: { width: BOTTOM_ROW[0].width, height: BOTTOM_ROW[0].height },
  scale: { x: 1, y: 1 },
  elements: bottomElements,
};

const players: Partial<PlayerDesign>[] = [
  slot(first, 1.3, TALL_STAGING, { left: true, top: true }),
  ...TOP_ROW.map((card) => slot(card, 1.08, SQUARE_STAGING, { top: true })),
  ...BOTTOM_ROW.map((card) => ({ position: p(card.x, card.y) })),
];

export const kagaribiDoublesDesign: Design = {
  ...kagaribiDesign,
  name: "Kagaribi Doubles",
  colorPalette: kagaribiColorPalette,
  textPalette: {
    ...kagaribiDesign.textPalette,
    entrantsText: {
      text: `${DesignPlaceholder.ENTRANTS} TEAMS`,
      name: "Entrants",
    },
  },
  background: kagaribiBackground,
  tournament: kagaribiTournament,
  basePlayer,
  players,
};
