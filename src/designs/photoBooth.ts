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

// Doubles. Every team is a photo booth strip pegged to a line in front of
// the booth's curtain: one frame for each player, their name written under
// it.
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const LINE_Y = 178;
/** How far under the line a strip's top edge hangs. */
const HANG = 14;
const STRIP_GAP = 22;

const p = (x: number, y: number): Point => ({ x, y });

const colorPalette: Design["colorPalette"] = {
  curtain: { color: "rgb(28, 92, 104)", name: "Curtain", group: "Background" },
  folds: {
    color: "rgba(8, 40, 48, 0.3)",
    name: "Curtain Folds",
    group: "Background",
  },
  line: { color: "rgb(240, 232, 214)", name: "Line", group: "Background" },
  peg: { color: "rgb(222, 178, 112)", name: "Pegs", group: "Background" },
  strip: { color: "rgb(251, 248, 240)", name: "Strip", group: "Strip" },
  shadow: { color: "rgb(4, 26, 32)", name: "Strip Shadow", group: "Strip" },
  frameA: { color: "rgb(244, 184, 66)", name: "First Frame", group: "Strip" },
  frameB: { color: "rgb(238, 124, 92)", name: "Second Frame", group: "Strip" },
  ink: { color: "rgb(40, 38, 36)", name: "Ink", group: "Text" },
  inkMuted: { color: "rgb(132, 124, 112)", name: "Sponsor", group: "Text" },
  accent: { color: "rgb(204, 62, 48)", name: "Placement", group: "Text" },
  title: { color: "rgb(251, 248, 240)", name: "Title", group: "Text" },
  details: { color: "rgb(176, 214, 216)", name: "Details", group: "Text" },
};

type StripSize = {
  /** Width of the strip. */
  width: number;
  /** Height of one frame. */
  frame: number;
  /** Height of the placement over the first frame. */
  header: number;
  /** Height of the name under each frame. */
  caption: number;
  pad: number;
  tag: number;
};

const stripHeight = ({ frame, header, caption, pad }: StripSize) =>
  header + 2 * (frame + caption) + pad * 0.6;

const createStripElements = (size: StripSize): ElementConfig[] => {
  const { width, frame, header, caption, pad, tag } = size;
  const height = stripHeight(size);
  const frameWidth = width - 2 * pad;
  const frameSize = { width: frameWidth, height: frame };
  const prefixSize = Math.round(tag * 0.62);
  const icon = Math.round(tag * 1.05);
  const flagHeight = Math.round(tag * 0.72);
  const corner = Math.round(pad * 0.5);

  const photo = (
    member: TeamMember,
    y: number,
    fill: string,
  ): ElementConfig => {
    const teammate = member === "teammate";
    const prefix = teammate
      ? DesignPlaceholder.TEAMMATE_PREFIX
      : DesignPlaceholder.PLAYER_PREFIX;

    return {
      type: "group",
      id: `${member}Photo`,
      position: p(pad, y),
      size: { width: frameWidth, height: frame + caption },
      elements: [
        {
          type: "group",
          position: p(0, 0),
          size: frameSize,
          clip: true,
          clipCornerRadius: 3,
          elements: [
            { type: "rect", fill, position: p(0, 0), size: frameSize },
            {
              type: "characterImage",
              member,
              shadowEnabled: false,
              fillMode: "cover",
              position: p(0, 0),
              size: frameSize,
            },
          ],
        },
        {
          type: "playerFlag",
          member,
          conditions: [
            teammate
              ? DesignPlaceholder.TEAMMATE_COUNTRY
              : DesignPlaceholder.PLAYER_COUNTRY,
          ],
          position: p(corner, corner),
          size: { width: Math.round(flagHeight * 1.45), height: flagHeight },
          fillMode: "contain",
          align: "left",
        },
        {
          type: "customAltCharacterImage",
          member,
          position: p(corner, frame - corner - icon),
          size: { height: icon, maxWidth: frameWidth - 2 * corner },
          gap: 3,
          elementTemplate: {
            type: "characterImage",
            position: p(0, 0),
            size: { width: icon, height: icon },
          },
        },
        {
          type: "flexGroup",
          id: `${member}Caption`,
          position: p(0, frame),
          size: { width: frameWidth, height: caption },
          direction: "row",
          align: "center",
          justify: "center",
          gap: Math.round(tag * 0.3),
          elements: [
            {
              type: "smartText",
              text: prefix,
              conditions: [prefix],
              // Shrinks along with the tag, so a long sponsor cannot push the
              // name out of the line.
              flex: { shrink: true },
              fontSize: prefixSize,
              fontWeight: 400,
              fill: "inkMuted",
              verticalAlign: "middle",
              position: p(0, baselineShift(prefixSize, tag)),
              size: { height: caption },
            },
            {
              type: "smartText",
              text: teammate
                ? DesignPlaceholder.TEAMMATE_TAG
                : DesignPlaceholder.PLAYER_TAG,
              fontSize: tag,
              fontWeight: 400,
              fill: "ink",
              verticalAlign: "middle",
              position: p(0, 0),
              size: { height: caption },
              flex: { shrink: true },
            },
          ],
        },
      ],
    };
  };

  const pegWidth = Math.round(width * 0.075);
  const pegHeight = Math.round(width * 0.2);
  const placement = Math.round(header * 0.74);
  const suffix = Math.round(placement * 0.5);

  return [
    {
      name: "Strip",
      type: "rect",
      fill: "strip",
      cornerRadius: 4,
      shadowColor: "shadow",
      shadowBlur: 26,
      shadowOffset: { x: 0, y: 12 },
      shadowOpacity: 0.45,
      position: p(0, 0),
      size: { width, height },
    },
    {
      type: "flexGroup",
      id: "placement",
      position: p(0, pad * 0.2),
      size: { width, height: header },
      direction: "row",
      align: "center",
      justify: "center",
      gap: 2,
      elements: [
        {
          type: "smartText",
          text: DesignPlaceholder.PLAYER_PLACEMENT,
          fontSize: placement,
          fontWeight: 400,
          fill: "accent",
          verticalAlign: "middle",
          position: p(0, 0),
          size: { height: header },
        },
        {
          type: "smartText",
          text: DesignPlaceholder.PLAYER_PLACEMENT_SUFFIX,
          fontSize: suffix,
          fontWeight: 400,
          fill: "accent",
          verticalAlign: "middle",
          position: p(0, -baselineShift(suffix, placement)),
          size: { height: header },
        },
      ],
    },
    photo("player", header, "frameA"),
    photo("teammate", header + frame + caption, "frameB"),
    {
      name: "Peg",
      type: "rect",
      fill: "peg",
      cornerRadius: 3,
      shadowColor: "shadow",
      shadowBlur: 6,
      shadowOffset: { x: 0, y: 2 },
      shadowOpacity: 0.4,
      position: p((width - pegWidth) / 2, -HANG - pegHeight * 0.35),
      size: { width: pegWidth, height: pegHeight },
    },
  ];
};

const FIRST: StripSize = {
  width: 310,
  frame: 300,
  header: 92,
  caption: 62,
  pad: 20,
  tag: 36,
};
const PODIUM: StripSize = {
  width: 222,
  frame: 268,
  header: 70,
  caption: 50,
  pad: 14,
  tag: 29,
};
const REST: StripSize = {
  width: 186,
  frame: 232,
  header: 60,
  caption: 44,
  pad: 12,
  tag: 25,
};

const SIZES = [FIRST, PODIUM, PODIUM, PODIUM, REST, REST, REST, REST];
/** Degrees each strip hangs off true, so the row doesn't look ruled. */
const TILTS = [-1.2, 1.4, -0.8, 1.1, -1.5, 0.7, -1, 1.3];

const TOTAL_WIDTH =
  SIZES.reduce((sum, size) => sum + size.width, 0) +
  (SIZES.length - 1) * STRIP_GAP;

const basePlayer: PlayerDesign = {
  position: p(0, 0),
  size: { width: REST.width, height: stripHeight(REST) },
  scale: { x: 1, y: 1 },
  elements: createStripElements(REST),
};

const elementsBySize = new Map(
  [FIRST, PODIUM].map((size) => [size, createStripElements(size)]),
);

const players: Partial<PlayerDesign>[] = SIZES.map((size, index) => {
  const x =
    (CANVAS_WIDTH - TOTAL_WIDTH) / 2 +
    SIZES.slice(0, index).reduce((sum, s) => sum + s.width + STRIP_GAP, 0);
  const elements = elementsBySize.get(size);

  return {
    position: p(Math.round(x), LINE_Y + HANG),
    rotation: TILTS[index],
    ...(elements && {
      size: { width: size.width, height: stripHeight(size) },
      elements,
    }),
  };
});

const background: LayerDesign = {
  elements: [
    {
      type: "rect",
      fill: "curtain",
      position: p(0, 0),
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    },
    {
      type: "pattern",
      pattern: "lines",
      color: "folds",
      spacing: 96,
      weight: 40,
      angle: 90,
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
    {
      name: "Line",
      type: "rect",
      fill: "line",
      position: p(0, LINE_Y),
      size: { width: CANVAS_WIDTH, height: 4 },
    },
  ],
};

const PAD = 48;
const FOOTER_MIDDLE = 1030;
const ICON_SIZE = 64;

const tournament: LayerDesign = {
  elements: [
    {
      type: "smartText",
      id: "titleText",
      name: "Title",
      textId: "titleText",
      fontSize: 84,
      fontWeight: 400,
      fill: "title",
      align: "center",
      verticalAlign: "middle",
      anchor: "topMiddle",
      position: p(CANVAS_WIDTH / 2, 30),
      size: { width: 1000, height: 104 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "eventText",
      name: "Event",
      textId: "eventText",
      fontSize: 34,
      fontWeight: 400,
      fill: "details",
      position: p(PAD, 48),
      size: { width: 380, height: 42 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "dateText",
      name: "Date",
      textId: "dateText",
      fontSize: 30,
      fontWeight: 400,
      fill: "title",
      position: p(PAD, 94),
      size: { width: 380, height: 38 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "locationText",
      name: "Location",
      textId: "locationText",
      fontSize: 34,
      fontWeight: 400,
      fill: "details",
      anchor: "topRight",
      align: "right",
      position: p(CANVAS_WIDTH - PAD, 48),
      size: { width: 380, height: 42 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "entrantsText",
      name: "Entrants",
      textId: "entrantsText",
      fontSize: 30,
      fontWeight: 400,
      fill: "title",
      anchor: "topRight",
      align: "right",
      position: p(CANVAS_WIDTH - PAD, 94),
      size: { width: 380, height: 38 },
      selectable: true,
    },
    {
      type: "smartText",
      id: "urlText",
      name: "URL",
      textId: "urlText",
      fontSize: 28,
      fontWeight: 400,
      fill: "details",
      anchor: "rightMiddle",
      align: "right",
      position: p(CANVAS_WIDTH - PAD, FOOTER_MIDDLE),
      size: { width: 900, height: 36 },
      selectable: true,
    },
    {
      type: "tournamentIcon",
      id: "tournamentIcon",
      name: "Tournament Icon",
      conditions: [RenderCondition.TOURNAMENT_ICON],
      position: p(CANVAS_WIDTH - PAD - ICON_SIZE, 940),
      size: { width: ICON_SIZE, height: ICON_SIZE },
      fillMode: "contain",
    },
  ],
};

export const photoBoothDesign: Design = {
  name: "Photo Booth",
  canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasDisplayScale: 0.5,
  colorPalette,
  textPalette: {
    titleText: { text: DesignPlaceholder.TOURNAMENT_NAME, name: "Title" },
    eventText: { text: DesignPlaceholder.EVENT_NAME, name: "Event" },
    dateText: { text: DesignPlaceholder.TOURNAMENT_DATE, name: "Date" },
    locationText: {
      text: `${DesignPlaceholder.TOURNAMENT_CITY}, ${DesignPlaceholder.TOURNAMENT_COUNTRY}`,
      name: "Location",
    },
    entrantsText: {
      text: `${DesignPlaceholder.ENTRANTS} teams`,
      name: "Entrants",
    },
    urlText: { text: DesignPlaceholder.TOURNAMENT_URL, name: "URL" },
  },
  background,
  tournament,
  basePlayer,
  players,
};
