import {
  GroupElement,
  ThumbnailDesign,
  ThumbnailElement,
} from "@/types/thumbnail/ThumbnailDesign";
import { DEFAULT_CANVAS_SIZE } from "@/consts/thumbnail/defaults";
import { uuid } from "@/utils/thumbnail/uuid";

export const matchBannerTemplate = (
  fontFamily = "Montserrat",
): ThumbnailDesign => {
  const canvas = { ...DEFAULT_CANVAS_SIZE };
  const W = canvas.width;
  const H = canvas.height;

  const bandAngle = -1.5;
  const bandHeight = 100;
  const bandOverhang = 100;
  const bandWidth = W + bandOverhang * 2;
  const bandFill = "#101418";

  const cx = W / 2;
  const cy = H / 2;

  const PAD = 80;
  const TEXT_W = 440;
  const TEXT_OFFSET = 28;

  // Children of each banner are axis-aligned in the GROUP's local frame.
  // The visual tilt comes entirely from the group's `rotation` property.
  // Group origin is at the band's top-left in canvas coords; children are
  // positioned relative to that origin (local x = canvas x − group x).
  const localTextX = PAD - -bandOverhang; // = PAD + bandOverhang = 180
  const localRightTextX = W - PAD - TEXT_W - -bandOverhang; // = 860

  const buildBannerGroup = (
    name: string,
    canvasY: number,
    children: ThumbnailElement[],
  ): GroupElement => ({
    id: uuid(),
    type: "group",
    name,
    x: -bandOverhang,
    y: canvasY,
    width: bandWidth,
    height: bandHeight,
    rotation: bandAngle,
    opacity: 1,
    visible: true,
    locked: false,
    scaleX: 1,
    scaleY: 1,
    children,
  });

  const topBand: ThumbnailElement = {
    id: uuid(),
    type: "shape",
    shape: "rect",
    templateRole: "topBand",
    name: "Top band",
    x: 0,
    y: 0,
    width: bandWidth,
    height: bandHeight,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: bandFill,
  };

  const leftPlayer: ThumbnailElement = {
    id: uuid(),
    type: "text",
    templateRole: "leftPlayerName",
    name: "Left player name",
    text: "Player 1",
    x: localTextX,
    y: TEXT_OFFSET,
    width: TEXT_W,
    height: 50,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fontFamily,
    fontSize: 50,
    fontStyle: "bold",
    fill: "#FFFFFF",
    align: "center",
    autoFit: true,
  };

  const rightPlayer: ThumbnailElement = {
    id: uuid(),
    type: "text",
    templateRole: "rightPlayerName",
    name: "Right player name",
    text: "Player 2",
    x: localRightTextX,
    y: TEXT_OFFSET,
    width: TEXT_W,
    height: 50,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fontFamily,
    fontSize: 50,
    fontStyle: "bold",
    fill: "#FFFFFF",
    align: "center",
    autoFit: true,
  };

  const bottomBand: ThumbnailElement = {
    id: uuid(),
    type: "shape",
    shape: "rect",
    templateRole: "bottomBand",
    name: "Bottom band",
    x: 0,
    y: 0,
    width: bandWidth,
    height: bandHeight,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: bandFill,
  };

  const leftBracket: ThumbnailElement = {
    id: uuid(),
    type: "text",
    templateRole: "leftBracketInfo",
    name: "Left bracket info",
    text: "Top 24",
    x: localTextX,
    y: TEXT_OFFSET,
    width: TEXT_W,
    height: 50,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fontFamily,
    fontSize: 44,
    fontStyle: "bold",
    fill: "#FFFFFF",
    align: "center",
    autoFit: true,
  };

  const rightBracket: ThumbnailElement = {
    id: uuid(),
    type: "text",
    templateRole: "rightBracketInfo",
    name: "Right bracket info",
    text: "Ultimate Singles",
    x: localRightTextX,
    y: TEXT_OFFSET,
    width: TEXT_W,
    height: 50,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fontFamily,
    fontSize: 44,
    fontStyle: "bold",
    fill: "#FFFFFF",
    align: "center",
    autoFit: true,
  };

  return {
    id: "match-banner",
    name: "Match Banner",
    canvasSize: canvas,
    background: { type: "split", left: "#a3303a", right: "#2b5d8a", angle: 0 },
    elements: [
      {
        id: uuid(),
        type: "character",
        templateRole: "leftCharacter",
        name: "Left character",
        x: 20,
        y: 0,
        width: 640,
        height: H,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        characterId: "1331",
        alt: 0,
        imageType: "main",
        flipX: false,
      },
      {
        id: uuid(),
        type: "character",
        templateRole: "rightCharacter",
        name: "Right character",
        x: W - 660,
        y: 0,
        width: 640,
        height: H,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        characterId: "1275",
        alt: 0,
        imageType: "main",
        flipX: false,
      },
      buildBannerGroup("Bottom banner", H - bandHeight, [
        bottomBand,
        leftBracket,
        rightBracket,
      ]),
      buildBannerGroup("Top banner", 0, [topBand, leftPlayer, rightPlayer]),
      {
        id: uuid(),
        type: "tournamentIcon",
        templateRole: "tournamentIcon",
        name: "Tournament icon",
        x: cx - 80,
        y: cy + 50,
        width: 160,
        height: 160,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        cornerRadius: 0,
      },
      {
        id: uuid(),
        type: "text",
        templateRole: "vsLabel",
        name: "VS",
        text: "VS",
        x: cx - 110,
        y: cy - 130,
        width: 220,
        height: 130,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fontFamily,
        fontSize: 130,
        fontStyle: "italic bold",
        fill: "#FFFFFF",
        align: "center",
        autoFit: true,
      },
    ],
  };
};
