export type ElementType = "text" | "image" | "group";

export type CanvasConfig = {
  size: { width: number; height: number };
  displayScale: number;
  background: BackgroundConfig;
};

type BaseElementConfig = {
  position: { x: number; y: number };
  size?: { width: number; height: number };
  scale?: { x: number; y: number };
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

export type ImageElementConfig = BaseElementConfig & {
  type: "image";
  imgSrc: string;
};

export type GroupElementConfig = BaseElementConfig & {
  type: "group";
};

export type ElementConfig =
  | TextElementConfig
  | ImageElementConfig
  | GroupElementConfig
  | BaseElementConfig;

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
  elements: (TextElementConfig | ImageElementConfig)[];
};

export type PlayerLayoutConfig = {
  frame?: BackgroundConfig;
  character?: BaseElementConfig;
  alternateCharacters?: BaseElementConfig;
  placement?: TextElementConfig;
  name: TextElementConfig;
  size: { width: number; height: number };
} & BaseElementConfig;

export type LayoutConfig = {
  canvas: CanvasConfig;
  background?: BackgroundConfig;
  tournament?: TournamentConfig;
  basePlayer: PlayerLayoutConfig;
  players: Partial<PlayerLayoutConfig>[];
};
