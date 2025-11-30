export type ElementType =
  | "text"
  | "smartText"
  | "image"
  | "group"
  | "rect"
  | "svg"
  | "customImage"
  | "characterImage"
  | "altCharacterImage";

export type CanvasConfig = {
  size: { width: number; height: number };
  displayScale: number;
  background: BackgroundConfig;
};

type BaseElementConfig = {
  position: { x: number; y: number };
  size?: { width?: number; height?: number };
  scale?: { x: number; y: number };
  rotation?: number;
  offset?: { x: number; y: number };
  clip?: boolean;
};

export type TextElementConfig = BaseElementConfig & {
  type: "text";
  text: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: string;
  fill?: string;
  align?: "left" | "center" | "right";
};

export type SmartTextElementConfig = BaseElementConfig & {
  type: "smartText";
  text: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: string;
  fill?: string;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
  shadowOpacity?: number;
};

export type ImageElementConfig = BaseElementConfig & {
  type: "image";
  imgSrc: string;
};

export type GroupElementConfig = BaseElementConfig & {
  type: "group";
};

export type RectElementConfig = BaseElementConfig & {
  type: "rect";
  fill?: string;
};

export type CustomImageElementConfig = BaseElementConfig & {
  type: "customImage";
  imgSrc: string;
};

export type CharacterImageElementConfig = BaseElementConfig & {
  type: "characterImage";
  customImgSrc?: string;
};

export type AltCharacterImageElementConfig = BaseElementConfig & {
  type: "altCharacterImage";
};

export type SvgElementConfig = BaseElementConfig & {
  type: "svg";
  src: string;
};

export type ElementConfig =
  | TextElementConfig
  | SmartTextElementConfig
  | ImageElementConfig
  | GroupElementConfig
  | CharacterImageElementConfig
  | AltCharacterImageElementConfig
  | RectElementConfig
  | CustomImageElementConfig
  | SvgElementConfig;

export type BackgroundConfig =
  | {
      type: "color";
      color: string;
    }
  | {
      type: "image";
      imgSrc: string;
    };

export type TournamentConfig = {
  elements: ElementConfig[];
};

export type PlayerLayoutConfig = {
  frame?: BackgroundConfig;
  elements: ElementConfig[];
} & BaseElementConfig;

export type LayoutConfig = {
  canvas: CanvasConfig;
  background?: BackgroundConfig;
  tournament?: TournamentConfig;
  basePlayer: PlayerLayoutConfig;
  players: Partial<PlayerLayoutConfig>[];
};
