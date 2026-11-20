import {
  Design,
  ElementConfig,
  LayerDesign,
  PlayerDesign,
} from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

// Neon signs on a brick wall: each player is a glass-tube frame with glowing
// lettering, one colour per placement. The winner gets the long sign on top,
// second and third share a row, and the rest are small squares.
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const MARGIN = 105;
const CONTENT_WIDTH = CANVAS_WIDTH - 2 * MARGIN;
const GUTTER = 30;

type SignKind = "hero" | "wide" | "small";
type Sign = {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Palette key of the tube's colour. */
  color: string;
  kind: SignKind;
};

const HERO_HEIGHT = 222;
const WIDE_HEIGHT = 166;
const SMALL_HEIGHT = 306;
const HERO_Y = 250;
const WIDE_Y = HERO_Y + HERO_HEIGHT + 32;
const SMALL_Y = WIDE_Y + WIDE_HEIGHT + 34;
const WIDE_WIDTH = (CONTENT_WIDTH - GUTTER) / 2;
const SMALL_WIDTH = (CONTENT_WIDTH - 4 * GUTTER) / 5;

// Tied placements share a colour.
const SMALL_COLORS = [
  "neonGreen",
  "neonOrange",
  "neonOrange",
  "neonPurple",
  "neonPurple",
];

const SIGNS: Sign[] = [
  {
    x: MARGIN,
    y: HERO_Y,
    width: CONTENT_WIDTH,
    height: HERO_HEIGHT,
    color: "neonGold",
    kind: "hero",
  },
  {
    x: MARGIN,
    y: WIDE_Y,
    width: WIDE_WIDTH,
    height: WIDE_HEIGHT,
    color: "neonCyan",
    kind: "wide",
  },
  {
    x: MARGIN + WIDE_WIDTH + GUTTER,
    y: WIDE_Y,
    width: WIDE_WIDTH,
    height: WIDE_HEIGHT,
    color: "neonPink",
    kind: "wide",
  },
  ...SMALL_COLORS.map((color, i): Sign => ({
    x: MARGIN + i * (SMALL_WIDTH + GUTTER),
    y: SMALL_Y,
    width: SMALL_WIDTH,
    height: SMALL_HEIGHT,
    color,
    kind: "small",
  })),
];

const p = (x: number, y: number) => ({ x, y });

// The winner's sign.
const HERO_PAD = 58;
const HERO_ICON = 150;

const TRANSPARENT = "rgba(0, 0, 0, 0)";

const colorPalette: Design["colorPalette"] = {
  wall: { color: "rgb(48, 28, 37)", name: "Bricks", group: "Wall" },
  mortar: { color: "rgb(14, 8, 11)", name: "Mortar", group: "Wall" },
  tube: { color: "rgb(255, 248, 250)", name: "Lit Tube", group: "Neon" },
  neonTitle: { color: "rgb(255, 64, 170)", name: "Title", group: "Neon" },
  neonInfo: { color: "rgb(70, 200, 255)", name: "Details", group: "Neon" },
  neonGold: { color: "rgb(255, 196, 46)", name: "1st", group: "Neon" },
  neonCyan: { color: "rgb(54, 208, 255)", name: "2nd", group: "Neon" },
  neonPink: { color: "rgb(255, 70, 170)", name: "3rd", group: "Neon" },
  neonGreen: { color: "rgb(92, 236, 120)", name: "4th", group: "Neon" },
  neonOrange: { color: "rgb(255, 138, 70)", name: "5th", group: "Neon" },
  neonPurple: { color: "rgb(168, 120, 255)", name: "7th", group: "Neon" },
};

/** A halo in `color` around whatever it is spread onto. */
const glow = (color: string, blur: number) =>
  ({
    shadowColor: color,
    shadowBlur: blur,
    shadowOffset: { x: 0, y: 0 },
    shadowOpacity: 1,
  }) as const;

/** A lit glass tube bent into a rounded frame: a faint wash of its colour on
 *  the wall, the coloured glow, and the near-white core. */
const tubeFrame = ({ width, height, color }: Sign): ElementConfig[] => {
  const box = { position: p(0, 0), size: { width, height } };
  const cornerRadius = 30;

  return [
    { type: "rect", fill: color, opacity: 0.13, cornerRadius, ...box },
    {
      type: "rect",
      fill: TRANSPARENT,
      stroke: color,
      strokeWidth: 10,
      cornerRadius,
      ...glow(color, 36),
      ...box,
    },
    {
      type: "rect",
      fill: TRANSPARENT,
      stroke: "tube",
      strokeWidth: 4,
      cornerRadius,
      ...box,
    },
  ];
};

/** Small spaced capitals: sponsor, labels. */
const smallCaps = (color: string, fontSize: number) =>
  ({
    textTransform: "uppercase",
    fontSize,
    fontWeight: 700,
    letterSpacing: fontSize * 0.28,
    fill: "tube",
    ...glow(color, 10),
  }) as const;

/** Flag and sponsor on one line. With `fit: "content"` the row is only as
 *  wide as what it holds, up to `width`. */
const sponsorRow = (
  color: string,
  width: number,
  fontSize: number,
  justify: "start" | "center",
  fit: "box" | "content" = "box",
  conditions?: ElementConfig["conditions"],
): ElementConfig => ({
  type: "flexGroup",
  id: "sponsorRow",
  conditions,
  position: p(0, 0),
  size: {
    ...(fit === "content" ? { maxWidth: width } : { width }),
    height: fontSize * 1.5,
  },
  direction: "row",
  align: "center",
  justify,
  gap: fontSize * 0.6,
  elements: [
    {
      type: "playerFlag",
      conditions: [DesignPlaceholder.PLAYER_COUNTRY],
      // Capitals sit a little above the middle of their line; the flag is
      // raised to share their centre.
      position: p(0, -fontSize * 0.07),
      size: { width: fontSize * 1.4, height: fontSize * 0.95 },
      fillMode: "contain",
    },
    {
      type: "smartText",
      id: "prefixText",
      text: DesignPlaceholder.PLAYER_PREFIX,
      conditions: [DesignPlaceholder.PLAYER_PREFIX],
      ...smallCaps(color, fontSize),
      verticalAlign: "middle",
      position: p(0, 0),
      size: { height: fontSize * 1.5 },
      flex: { shrink: true },
    },
  ],
});

const ICON_GAP = 10;

/** The player's characters: the main one, then the others. The first two
 *  others are drawn as large as the main one; from the third on they shrink
 *  into a grid that takes up the room of those two. */
const fighters = (iconSize: number): ElementConfig[] => [
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
    size: { maxWidth: 2 * iconSize + ICON_GAP, height: iconSize },
    gap: ICON_GAP,
    align: "center",
    alignLastRow: "center",
    elementTemplate: {
      type: "characterImage",
      position: p(0, 0),
      size: { width: iconSize, height: iconSize },
    },
  },
];

const fightersWidth = (iconSize: number) => 3 * iconSize + 2 * ICON_GAP;

// The sponsor line shows a prefix, a flag or both, and is left out when the
// player has neither. Conditions can only be combined with "and", so each
// case is spelled out: prefix (flag or not), flag alone, neither.
const sponsorLineConditions: NonNullable<ElementConfig["conditions"]>[] = [
  [DesignPlaceholder.PLAYER_PREFIX],
  [
    RenderCondition.NOT,
    DesignPlaceholder.PLAYER_PREFIX,
    DesignPlaceholder.PLAYER_COUNTRY,
  ],
  [
    RenderCondition.NOT,
    DesignPlaceholder.PLAYER_PREFIX,
    RenderCondition.NOT,
    DesignPlaceholder.PLAYER_COUNTRY,
  ],
];

/** The hero and wide signs: the number, then the tag with the sponsor line
 *  over it; fighters on the right, taking the room they need from those. */
const rowSignElements = (sign: Sign): ElementConfig[] => {
  const { width, height, color, kind } = sign;
  const isHero = kind === "hero";
  const pad = isHero ? HERO_PAD : 46;
  const iconSize = isHero ? HERO_ICON : 100;
  const lettering = isHero ? 150 : 96;
  // The tag is a little smaller than the number, leaving room for the
  // sponsor line over it.
  const tagSize = isHero ? 128 : 84;
  const printSize = isHero ? 30 : 24;
  const gap = isHero ? 30 : 22;
  const inner = width - 2 * pad;

  const tubeText = {
    fontWeight: 500,
    fill: "tube",
    verticalAlign: "middle",
    position: p(0, 0),
    ...glow(color, isHero ? 30 : 24),
  } as const;

  return [
    ...tubeFrame(sign),
    {
      type: "flexGroup",
      id: "signRow",
      position: p(pad, 0),
      size: { width: inner, height },
      direction: "row",
      align: "center",
      justify: "start",
      gap,
      elements: [
        {
          type: "flexGroup",
          id: "lettering",
          position: p(0, 0),
          size: {
            maxWidth: inner,
            height,
          },
          direction: "row",
          align: "center",
          justify: "start",
          gap: lettering * 0.26,
          flex: { shrink: true },
          elements: [
            ...sponsorLineConditions.map((conditions, i): ElementConfig => ({
              type: "smartText",
              id: "placementText",
              text: DesignPlaceholder.PLAYER_PLACEMENT,
              conditions,
              ...tubeText,
              fontSize: lettering,
              // Level with the tag, which a sponsor line pushes down.
              position: p(0, i < 2 ? (printSize * 1.5) / 2 : 0),
              size: { height },
            })),
            {
              type: "flexGroup",
              id: "nameBlock",
              position: p(0, 0),
              size: { maxWidth: inner, height },
              direction: "column",
              justify: "center",
              stretch: true,
              flex: { shrink: true },
              elements: [
                ...sponsorLineConditions
                  .slice(0, 2)
                  .map((conditions) =>
                    sponsorRow(
                      color,
                      inner,
                      printSize,
                      "start",
                      "content",
                      conditions,
                    ),
                  ),
                {
                  type: "smartText",
                  id: "tagText",
                  text: DesignPlaceholder.PLAYER_TAG,
                  textTransform: "uppercase",
                  ...tubeText,
                  fontSize: tagSize,
                  size: { height: tagSize },
                },
              ],
            },
          ],
        },
        // Pushes what follows to the right edge.
        {
          type: "rect",
          fill: TRANSPARENT,
          position: p(0, 0),
          size: { width: 0, height: 1 },
          flex: { grow: true },
        },
        {
          type: "flexGroup",
          id: "fighters",
          position: p(0, 0),
          size: { maxWidth: fightersWidth(iconSize), height: iconSize },
          direction: "row",
          align: "center",
          gap: ICON_GAP,
          elements: fighters(iconSize),
        },
      ],
    },
  ];
};

/** The small signs: placement, sponsor line, tag and fighters, stacked and
 *  centred as a block. */
const smallSignElements = (sign: Sign): ElementConfig[] => {
  const { width, height, color } = sign;
  const inner = width - 44;
  // Three across fill the sign.
  const iconSize = 84;

  return [
    ...tubeFrame(sign),
    {
      type: "flexGroup",
      id: "stack",
      position: p(22, 0),
      size: { width: inner, height },
      direction: "column",
      align: "center",
      justify: "center",
      gap: 4,
      elements: [
        {
          type: "smartText",
          id: "placementText",
          text: DesignPlaceholder.PLAYER_PLACEMENT,
          fontSize: 52,
          fontWeight: 500,
          fill: "tube",
          align: "center",
          verticalAlign: "middle",
          position: p(0, 0),
          size: { width: inner, height: 56 },
          ...glow(color, 18),
        },
        // Always takes its line, so the five signs stay level with each
        // other whether or not a player has a prefix or flag.
        sponsorRow(color, inner, 18, "center"),
        {
          type: "smartText",
          id: "tagText",
          text: DesignPlaceholder.PLAYER_TAG,
          textTransform: "uppercase",
          fontSize: 64,
          fontWeight: 500,
          fill: "tube",
          align: "center",
          verticalAlign: "middle",
          position: p(0, 0),
          size: { width: inner, height: 72 },
          ...glow(color, 20),
        },
        {
          type: "flexGroup",
          id: "fighters",
          // A little air under the tag.
          position: p(0, 8),
          size: { width: inner, height: iconSize },
          direction: "row",
          align: "center",
          justify: "center",
          gap: ICON_GAP,
          elements: fighters(iconSize),
        },
      ],
    },
  ];
};

const signElements = (sign: Sign): ElementConfig[] =>
  sign.kind === "small" ? smallSignElements(sign) : rowSignElements(sign);

const basePlayer: PlayerDesign = {
  position: p(SIGNS[0].x, SIGNS[0].y),
  size: { width: SIGNS[0].width, height: SIGNS[0].height },
  scale: { x: 1, y: 1 },
  elements: signElements(SIGNS[0]),
};

const players: Design["players"] = SIGNS.map((sign, index) => ({
  id: `player-${index}`,
  position: p(sign.x, sign.y),
  size: { width: sign.width, height: sign.height },
  elements: signElements(sign),
}));

const fullCanvas = {
  position: p(0, 0),
  size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
};

const background: LayerDesign = {
  elements: [
    { type: "rect", fill: "wall", ...fullCanvas },
    {
      type: "pattern",
      pattern: "brick",
      color: "mortar",
      spacing: 45,
      weight: 5,
      ...fullCanvas,
    },
    // The title's light spilling down the wall.
    {
      type: "rect",
      fill: {
        type: "radial",
        center: { x: 0.5, y: 0.08 },
        colorStops: [
          { position: 0, color: "rgba(255, 64, 170, 0.34)" },
          { position: 0.55, color: "rgba(255, 64, 170, 0)" },
        ],
      },
      ...fullCanvas,
    },
    // Dark corners.
    {
      type: "rect",
      fill: {
        type: "radial",
        colorStops: [
          { position: 0.45, color: "rgba(0, 0, 0, 0)" },
          { position: 1, color: "rgba(0, 0, 0, 0.62)" },
        ],
      },
      ...fullCanvas,
    },
  ],
};

const TITLE_BOX = {
  position: p(MARGIN, 26),
  size: { width: CONTENT_WIDTH, height: 140 },
};

const tournament: LayerDesign = {
  elements: [
    // A wide, soft copy under the title, for the bloom a single shadow
    // cannot give.
    {
      type: "smartText",
      id: "tournamentNameBloom",
      textId: "tournamentName",
      fontSize: 104,
      fontWeight: 500,
      fill: "neonTitle",
      align: "center",
      verticalAlign: "middle",
      opacity: 0.75,
      ...glow("neonTitle", 70),
      ...TITLE_BOX,
    },
    {
      type: "smartText",
      id: "tournamentNameText",
      textId: "tournamentName",
      fontSize: 104,
      fontWeight: 500,
      fill: "tube",
      align: "center",
      verticalAlign: "middle",
      selectable: true,
      ...glow("neonTitle", 22),
      ...TITLE_BOX,
    },
    {
      type: "smartText",
      id: "tournamentInfoText",
      textId: "tournamentInfo",
      ...smallCaps("neonInfo", 24),
      align: "center",
      verticalAlign: "middle",
      position: p(MARGIN, 176),
      size: { width: CONTENT_WIDTH, height: 40 },
      selectable: true,
    },
  ],
};

export const neonSignDesign: Design = {
  name: "Neon Sign",
  canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasDisplayScale: 0.25,
  colorPalette,
  textPalette: {
    tournamentName: {
      text: `${DesignPlaceholder.TOURNAMENT_NAME}`,
      name: "Tournament Name",
    },
    tournamentInfo: {
      text: `${DesignPlaceholder.TOURNAMENT_DATE} · ${DesignPlaceholder.TOURNAMENT_LOCATION} · ${DesignPlaceholder.ENTRANTS} Entrants`,
      name: "Tournament Info",
    },
  },
  background,
  tournament,
  basePlayer,
  players,
};
