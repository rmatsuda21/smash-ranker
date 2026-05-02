export type ThumbnailElementType =
  | "text"
  | "image"
  | "character"
  | "flag"
  | "tournamentIcon"
  | "shape"
  | "group";

export type ThumbnailElementBase = {
  id: string;
  name?: string;
  templateRole?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
};

export type TextElement = ThumbnailElementBase & {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  align: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  letterSpacing?: number;
  lineHeight?: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  autoFit?: boolean;
};

export type ImageElement = ThumbnailElementBase & {
  type: "image";
  src: string;
  fillMode: "contain" | "cover";
  cropOffset?: { x: number; y: number };
  cropScale?: number;
  cornerRadius?: number;
};

export type CharacterElement = ThumbnailElementBase & {
  type: "character";
  characterId: string;
  alt: number;
  imageType: "stock" | "main";
  flipX: boolean;
  fillMode?: "contain" | "cover";
};

export type FlagElement = ThumbnailElementBase & {
  type: "flag";
  country: string;
  customSrc?: string;
};

export type TournamentIconElement = ThumbnailElementBase & {
  type: "tournamentIcon";
  src?: string;
  cornerRadius?: number;
};

export type ShapeElement = ThumbnailElementBase & {
  type: "shape";
  shape: "rect" | "circle";
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
};

export type GroupElement = ThumbnailElementBase & {
  type: "group";
  scaleX?: number;
  scaleY?: number;
  children: ThumbnailElement[];
};

export type ThumbnailElement =
  | TextElement
  | ImageElement
  | CharacterElement
  | FlagElement
  | TournamentIconElement
  | ShapeElement
  | GroupElement;

export type ThumbnailBackground =
  | { type: "color"; color: string }
  | { type: "image"; src: string; fillMode: "contain" | "cover" }
  | { type: "split"; left: string; right: string; angle: number };

export type ThumbnailDesign = {
  id: string;
  name: string;
  canvasSize: { width: number; height: number };
  background: ThumbnailBackground;
  elements: ThumbnailElement[];
};
