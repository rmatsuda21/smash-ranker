import {
  Design,
  ElementConfig,
  LayerDesign,
  PlayerDesign,
  Point,
} from "@/types/top8/Design";
import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

// A comic page: eight slanted panels and a title box. The winner gets the
// tall splash panel on the left; the rest read in rows, left to right.
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const OUTLINE_WIDTH = 9;

/** Panel corners on the canvas: top-left, top-right, bottom-right,
 *  bottom-left. Gutters between panels are 18px. */
const PANELS: Point[][] = [
  [p(30, 30), p(810, 30), p(720, 1050), p(30, 1050)],
  [p(828, 30), p(1395, 30), p(1335, 375), p(798, 375)],
  [p(1413, 30), p(1890, 30), p(1890, 375), p(1353, 375)],
  [p(796, 393), p(1140, 393), p(1185, 720), p(767, 720)],
  [p(1158, 393), p(1515, 393), p(1560, 720), p(1203, 720)],
  [p(1533, 393), p(1890, 393), p(1890, 720), p(1578, 720)],
  [p(765, 738), p(1110, 738), p(1065, 1050), p(738, 1050)],
  [p(1128, 738), p(1470, 738), p(1425, 1050), p(1083, 1050)],
];
const TITLE_BOX: Point[] = [
  p(1488, 738),
  p(1890, 738),
  p(1890, 1050),
  p(1443, 1050),
];

const PLACEMENT_WIDTH = 330;
/** Horizontal squeeze of the placement lettering (1 = the font's width). */
const PLACEMENT_SQUEEZE = 0.6;
/** How far the placement lettering leans, as a share of its height. */
const PLACEMENT_SLANT = 0.2;

type Tone = "burst" | "dots" | "lines";
const PANEL_TONES: Tone[] = [
  "burst",
  "dots",
  "burst",
  "lines",
  "dots",
  "lines",
  "dots",
  "lines",
];
/** Tilt of each panel's caption box, in degrees. */
const CAPTION_TILT = [1.5, -2, 1.5, -2, 1.5, -2, 1.5, -2];

function p(x: number, y: number): Point {
  return { x, y };
}

const boundsOf = (points: Point[]) => {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
};

const colorPalette: Design["colorPalette"] = {
  paper: { color: "rgb(253, 252, 248)", name: "Paper", group: "Page" },
  ink: { color: "rgb(17, 17, 17)", name: "Ink", group: "Page" },
  accent: { color: "rgb(225, 37, 27)", name: "Spot Colour", group: "Page" },
  mutedText: { color: "rgb(90, 90, 90)", name: "Prefix", group: "Text" },
};

/** Outlined lettering with a hard drop shadow, as on a comic sound effect. */
const outlined = (strokeWidth: number, shadow: number) =>
  ({
    stroke: "ink",
    strokeWidth,
    fillAfterStrokeEnabled: true,
    lineJoin: "round",
    shadowColor: "ink",
    shadowOffset: { x: shadow, y: shadow },
    shadowBlur: 0,
    shadowOpacity: 1,
  }) as const;

const toneElements = (
  tone: Tone,
  width: number,
  height: number,
): ElementConfig[] => {
  const box = { position: p(0, 0), size: { width, height } };

  if (tone === "burst") {
    return [
      {
        type: "pattern",
        pattern: "burst",
        color: "ink",
        rays: 64,
        weight: 0.3,
        center: p(0.5, 0.45),
        ...box,
      },
      // Clears the middle of the burst so the figure reads against paper.
      {
        type: "rect",
        fill: {
          type: "radial",
          center: p(0.5, 0.45),
          colorStops: [
            { position: 0, color: "paper" },
            { position: 0.3, color: "paper" },
            { position: 0.85, color: "rgba(253, 252, 248, 0)" },
          ],
        },
        ...box,
      },
    ];
  }

  if (tone === "dots") {
    return [
      {
        type: "pattern",
        pattern: "dots",
        color: "ink",
        opacity: 0.3,
        spacing: 12,
        weight: 3,
        ...box,
      },
    ];
  }

  return [
    {
      type: "pattern",
      pattern: "lines",
      color: "ink",
      opacity: 0.3,
      spacing: 13,
      weight: 2.2,
      angle: 60,
      ...box,
    },
  ];
};

const createPanelElements = (index: number): ElementConfig[] => {
  const corners = PANELS[index];
  const bounds = boundsOf(corners);
  const local = corners.map((corner) =>
    p(corner.x - bounds.x, corner.y - bounds.y),
  );
  const { width, height } = bounds;
  const isSplash = index === 0;
  // Top-right and bottom-left corners: the number hangs off the first, the
  // caption sits on the second.
  const topRight = local[1];
  const bottomLeft = local[3];

  // As wide as the panel allows, so long tags have room before shrinking.
  const captionWidth = isSplash
    ? 340
    : Math.min(320, width - bottomLeft.x - 60);
  const captionHeight = isSplash ? 96 : 66;

  // Where the fighter goes. The splash shows the whole figure, under the
  // sound effect. The small panels are bust shots, kept left of the number
  // in the top-right corner and above the caption in the bottom-left.
  // The top-row panels are wide enough to centre the fighter beside the
  // number; the narrower ones below have to move it away from the number:
  // left in the bottom row, right in the middle row, whose numbers are in
  // the top-left corner.
  const isTopRow = index === 1 || index === 2;
  const isMiddleRow = index >= 3 && index <= 5;
  const fighterShift = isTopRow ? -0.02 : isMiddleRow ? 0.1 : -0.08;
  const centerX = (local[0].x + local[1].x + local[2].x + local[3].x) / 4;
  const frame = isSplash ? height * 0.76 : height * 1.05;
  const focus = isSplash
    ? p(width * 0.48, height * 0.56)
    : p(centerX + width * fighterShift, height * 0.525);
  const box = Math.max(
    frame,
    2 * Math.max(focus.x, width - focus.x, focus.y, height - focus.y),
  );
  const tagSize = isSplash ? 46 : 30;

  const art: ElementConfig = {
    type: "group",
    id: "art",
    position: p(0, 0),
    size: { width, height },
    clipPoints: local,
    elements: [
      { type: "rect", fill: "paper", position: p(0, 0), size: bounds },
      ...toneElements(PANEL_TONES[index], width, height),
      {
        type: "characterImage",
        id: "character",
        // A square centred on the spot the face should land, since the
        // character crops centre each fighter in a square. Framing is then
        // the same whatever the panel's proportions. The square is grown
        // to cover the whole panel, with the art scaled back to `frame`,
        // so the art is cut by the panel's edges and never by its own box.
        position: p(focus.x - box / 2, focus.y - box / 2),
        size: { width: box, height: box },
        cropScaleMultiplier: frame / box,
        // The winner is shown head to toe; the rest are close-ups.
        uncropped: isSplash,
        fillMode: "contain",
        shadowEnabled: false,
        tone: { grayscale: true, contrast: 1.3 },
      },
      // Lower panels fade to ink at the bottom, under the caption.
      ...(index > 2
        ? [
            {
              type: "rect",
              fill: {
                type: "linear",
                angle: 180,
                colorStops: [
                  { position: 0.4, color: "rgba(17, 17, 17, 0)" },
                  { position: 1, color: "rgba(17, 17, 17, 0.5)" },
                ],
              },
              position: p(0, 0),
              size: { width, height },
            } satisfies ElementConfig,
          ]
        : []),
    ],
  };

  // The middle row's numbers sit in the top-left corner, where they clear
  // the second figure of a paired render; the others sit top-right. Panels
  // 4 and 5 lean in below their top-left corner, so their numbers start
  // further from it.
  const placementPosition = isMiddleRow
    ? p(local[0].x + (index === 3 ? 12 : 36), -2)
    : p(
        topRight.x - 22 - PLACEMENT_WIDTH * PLACEMENT_SQUEEZE,
        PLACEMENT_SLANT * 110 - 8,
      );
  // Sound-effect lettering: squeezed and slanted like hand-drawn italics,
  // white with a heavy outline and a hard shadow, the suffix raised beside
  // the number.
  const placement: ElementConfig = {
    type: "flexGroup",
    id: "placement",
    position: placementPosition,
    size: { width: PLACEMENT_WIDTH, height: 132 },
    scale: { x: PLACEMENT_SQUEEZE, y: 1 },
    skew: { x: -PLACEMENT_SLANT },
    rotation: -4,
    direction: "row",
    justify: isMiddleRow ? "start" : "end",
    align: "start",
    gap: -14,
    elements: [
      {
        type: "smartText",
        id: "placementNumber",
        text: DesignPlaceholder.PLAYER_PLACEMENT,
        fontSize: 110,
        fill: "paper",
        position: p(0, 0),
        size: { height: 116 },
        ...outlined(11, 7),
      },
      {
        type: "smartText",
        id: "placementSuffix",
        text: DesignPlaceholder.PLAYER_PLACEMENT_SUFFIX,
        textTransform: "uppercase",
        fontSize: 48,
        fill: "paper",
        position: p(0, 8),
        size: { height: 54 },
        ...outlined(8, 5),
      },
    ],
  };

  const contentWidth = captionWidth - 32;
  const metaHeight = isSplash ? 30 : 21;
  const tagHeight = isSplash ? 52 : 36;
  const prefixText: ElementConfig = {
    type: "smartText",
    id: "prefixText",
    text: DesignPlaceholder.PLAYER_PREFIX,
    conditions: [DesignPlaceholder.PLAYER_PREFIX],
    fontSize: isSplash ? 25 : 17,
    fill: "mutedText",
    verticalAlign: "middle",
    position: p(0, 0),
    size: { height: metaHeight },
    flex: { shrink: true },
  };

  const caption: ElementConfig = {
    type: "group",
    id: "caption",
    // The two lower rows sit closer to the panel's bottom edge.
    position: p(
      bottomLeft.x + 22,
      height - captionHeight - (index > 2 ? 15 : 26),
    ),
    rotation: CAPTION_TILT[index],
    elements: [
      {
        type: "rect",
        fill: "ink",
        position: p(7, 7),
        size: { width: captionWidth, height: captionHeight },
      },
      {
        type: "rect",
        fill: "paper",
        stroke: "ink",
        strokeWidth: 5,
        position: p(0, 0),
        size: { width: captionWidth, height: captionHeight },
      },
      // Flag and sponsor on a small line above the tag, so the tag gets the
      // box's full width. Without either, the tag is centred vertically on its own.
      {
        type: "flexGroup",
        id: "captionContent",
        position: p(16, 0),
        size: { width: contentWidth, height: captionHeight },
        direction: "column",
        align: "start",
        justify: "center",
        gap: isSplash ? 2 : 0,
        elements: [
          {
            type: "flexGroup",
            id: "captionMeta",
            conditions: [DesignPlaceholder.PLAYER_COUNTRY],
            position: p(0, 0),
            size: { width: contentWidth, height: metaHeight },
            direction: "row",
            align: "center",
            justify: "start",
            gap: isSplash ? 12 : 8,
            elements: [
              {
                type: "playerFlag",
                position: p(0, 0),
                size: {
                  width: isSplash ? 40 : 27,
                  height: isSplash ? 28 : 19,
                },
                fillMode: "contain",
              },
              prefixText,
            ],
          },
          {
            type: "flexGroup",
            id: "captionMetaNoFlag",
            conditions: [
              RenderCondition.NOT,
              DesignPlaceholder.PLAYER_COUNTRY,
              DesignPlaceholder.PLAYER_PREFIX,
            ],
            position: p(0, 0),
            size: { width: contentWidth, height: metaHeight },
            direction: "row",
            align: "center",
            justify: "start",
            elements: [prefixText],
          },
          {
            type: "smartText",
            id: "tagText",
            text: DesignPlaceholder.PLAYER_TAG,
            fontSize: tagSize,
            fill: "ink",
            align: "left",
            verticalAlign: "middle",
            position: p(0, 0),
            size: { width: contentWidth, height: tagHeight },
          },
        ],
      },
    ],
  };

  return [
    art,
    {
      type: "polygon",
      id: "outline",
      points: local,
      stroke: "ink",
      strokeWidth: OUTLINE_WIDTH,
      position: p(0, 0),
    },
    // Secondary characters, as small icons in the top corner the number
    // leaves free.
    {
      type: "altCharacterImage",
      id: "altCharacters",
      position: isMiddleRow
        ? p(topRight.x - 20 - 170, 18)
        : p(local[0].x + 20, isSplash ? height - 190 : 18),
      size: { width: isSplash ? 300 : 170, height: isSplash ? 52 : 40 },
      gap: 6,
      rows: 1,
      justify: isMiddleRow ? "end" : "start",
      conditions: [RenderCondition.HAS_ALT_CHARACTERS],
    },
    // The splash panel is labelled by the sound effect instead of a number.
    ...(isSplash ? [] : [placement]),
    caption,
  ];
};

const basePlayer: PlayerDesign = {
  position: p(30, 30),
  size: { width: 780, height: 1020 },
  scale: { x: 1, y: 1 },
  elements: createPanelElements(0),
};

const players: Design["players"] = PANELS.map((corners, index) => {
  const bounds = boundsOf(corners);
  return {
    id: `player-${index}`,
    position: p(bounds.x, bounds.y),
    size: { width: bounds.width, height: bounds.height },
    elements: createPanelElements(index),
  };
});

const background: LayerDesign = {
  elements: [
    {
      type: "rect",
      fill: "paper",
      position: p(0, 0),
      size: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    },
  ],
};

const titleBounds = boundsOf(TITLE_BOX);
const TITLE_TEXT_LEFT = TITLE_BOX[0].x + 26;
const TITLE_TEXT_WIDTH = TITLE_BOX[1].x - 28 - TITLE_TEXT_LEFT;

const TITLE_TEXT_RIGHT = TITLE_BOX[1].x - 28;
/** Horizontal squeeze of the tournament name (1 = the font's width). */
const TITLE_NAME_SQUEEZE = 0.72;
const TITLE_NAME_SLANT = 0.12;
const TITLE_INFO_LINE = 24;
/** Horizontal squeeze of the lettering over the winner's panel. */
const SOUND_EFFECT_SQUEEZE = 0.72;
/** Room for the name and the lines under it: from near the box's top to
 *  just above the badge. */
const TITLE_BLOCK_HEIGHT = 250;
const BADGE_WIDTH = 140;
const BADGE_HEIGHT = 46;

const infoLine = (
  id: string,
  textId: string,
  condition: DesignPlaceholder,
): ElementConfig => ({
  type: "smartText",
  id,
  textId,
  conditions: [condition],
  textTransform: "uppercase",
  fontSize: 16,
  fill: "paper",
  align: "right",
  verticalAlign: "middle",
  position: p(0, 0),
  size: { width: TITLE_TEXT_WIDTH, height: TITLE_INFO_LINE },
  selectable: true,
});

const tournament: LayerDesign = {
  elements: [
    {
      type: "polygon",
      id: "titleBox",
      points: TITLE_BOX,
      fill: "ink",
      stroke: "ink",
      strokeWidth: OUTLINE_WIDTH,
      position: p(0, 0),
    },
    // Name over date, place and entrants, centred as one block in the box
    // above the badge, so a one-line name leaves no hole at the top. A line
    // with nothing to show drops out.
    {
      type: "flexGroup",
      id: "tournamentTitle",
      position: p(TITLE_TEXT_RIGHT - TITLE_TEXT_WIDTH, titleBounds.y + 16),
      size: { width: TITLE_TEXT_WIDTH, height: TITLE_BLOCK_HEIGHT },
      direction: "column",
      justify: "center",
      align: "end",
      elements: [
        // Squeezed, slanted capitals, to stand in for condensed comic
        // lettering. The transform lives on a wrapper so the text itself
        // stays selectable; with no height, the wrapper is as tall as the
        // wrapped name.
        {
          type: "group",
          id: "tournamentNameGroup",
          // Shifted right by about what the slant takes off the last line.
          position: p(TITLE_NAME_SLANT * 44 * TITLE_NAME_SQUEEZE, 0),
          size: { width: TITLE_TEXT_WIDTH },
          scale: { x: TITLE_NAME_SQUEEZE, y: 1 },
          skew: { x: -TITLE_NAME_SLANT },
          elements: [
            {
              type: "text",
              id: "tournamentNameText",
              textId: "tournamentName",
              textTransform: "uppercase",
              fontSize: 44,
              // What the box has left over the detail lines; a longer name
              // shrinks instead of pushing them out.
              maxHeight: TITLE_BLOCK_HEIGHT - 3 * TITLE_INFO_LINE,
              fill: "paper",
              align: "right",
              position: p(0, 0),
              size: { width: TITLE_TEXT_WIDTH / TITLE_NAME_SQUEEZE },
              selectable: true,
            },
          ],
        },
        // Breathing room under the name, given up as the name gets taller.
        {
          type: "rect",
          id: "tournamentTitleSpacer",
          fill: "rgba(0, 0, 0, 0)",
          position: p(0, 0),
          size: { width: TITLE_TEXT_WIDTH, height: 26 },
          flex: { shrink: true },
        },
        infoLine(
          "tournamentDateText",
          "tournamentDate",
          DesignPlaceholder.TOURNAMENT_DATE,
        ),
        infoLine(
          "tournamentLocationText",
          "tournamentLocation",
          DesignPlaceholder.TOURNAMENT_COUNTRY,
        ),
        infoLine(
          "tournamentEntrantsText",
          "tournamentEntrants",
          DesignPlaceholder.ENTRANTS,
        ),
      ],
    },
    // The badge hangs off the box's bottom edge, onto the page.
    {
      type: "group",
      id: "badge",
      position: p(TITLE_TEXT_RIGHT - BADGE_WIDTH, TITLE_BOX[2].y - 24),
      elements: [
        {
          type: "rect",
          fill: "accent",
          position: p(0, 0),
          size: { width: BADGE_WIDTH, height: BADGE_HEIGHT },
        },
        {
          type: "smartText",
          id: "badgeText",
          textId: "badge",
          textTransform: "uppercase",
          fontSize: 28,
          fill: "paper",
          align: "center",
          verticalAlign: "middle",
          position: p(8, 0),
          size: { width: BADGE_WIDTH - 16, height: BADGE_HEIGHT },
          selectable: true,
        },
      ],
    },
    // Over the splash panel. A tournament layer element so it draws on top
    // of the players and its text can be edited.
    // Squeezed and slanted like the placement numbers; the transform lives
    // on a wrapper so the text itself stays selectable.
    {
      type: "group",
      id: "soundEffect",
      position: p(72, 128),
      rotation: -7,
      scale: { x: SOUND_EFFECT_SQUEEZE, y: 1 },
      skew: { x: -0.16 },
      elements: [
        {
          type: "smartText",
          id: "soundEffectText",
          textId: "soundEffect",
          textTransform: "uppercase",
          fontSize: 172,
          fill: "accent",
          position: p(0, 0),
          size: { width: 670 / SOUND_EFFECT_SQUEEZE, height: 190 },
          selectable: true,
          ...outlined(12, 12),
        },
      ],
    },
  ],
};

export const comicBookDesign: Design = {
  name: "Comic Book",
  canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  canvasDisplayScale: 0.25,
  colorPalette,
  textPalette: {
    tournamentName: {
      text: `${DesignPlaceholder.TOURNAMENT_NAME}`,
      name: "Tournament Name",
    },
    tournamentDate: {
      text: `${DesignPlaceholder.TOURNAMENT_DATE}`,
      name: "Date",
    },
    tournamentLocation: {
      text: `${DesignPlaceholder.TOURNAMENT_LOCATION}`,
      name: "Location",
    },
    tournamentEntrants: {
      text: `${DesignPlaceholder.ENTRANTS} Entrants`,
      name: "Entrants",
    },
    badge: { text: "TOP 8", name: "Badge" },
    soundEffect: { text: "CHAMPION!!", name: "Sound Effect" },
  },
  background,
  tournament,
  basePlayer,
  players,
};
