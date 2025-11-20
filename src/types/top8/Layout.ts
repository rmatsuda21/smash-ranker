export type ElementType = "text" | "image" | "group";

export type CanvasConfig = {
  size: { width: number; height: number };
  background: BackgroundConfig;
  frame?: BackgroundConfig;
};

// Base properties shared by all elements
type BaseElementConfig = {
  x: number;
  y: number;
  width?: number;
  height?: number;
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

// Discriminated union type - TypeScript can narrow based on 'type' property
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
  character: BaseElementConfig;
  alternateCharacters: BaseElementConfig;
  name: TextElementConfig;
  position: { x: number; y: number };
  size: { width: number; height: number };
};

export type LayoutConfig = {
  canvas: CanvasConfig;
  background?: BackgroundConfig;
  tournament?: TournamentConfig;
  players: PlayerLayoutConfig[];
};
