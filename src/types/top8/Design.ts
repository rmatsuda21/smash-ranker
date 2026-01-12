import { type ComponentProps } from "react";
import { Group, Image, Rect, Text } from "react-konva";

import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";

export type ImageFillMode = "contain" | "cover";
type ImageAlign = "center" | "left" | "right" | "top" | "bottom";
type HorizontalAlign = "left" | "center" | "right";
type VerticalAlign = "top" | "middle" | "bottom";
type Anchor =
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "bottomMiddle"
  | "topMiddle"
  | "leftMiddle"
  | "rightMiddle"
  | "center";

export type ElementType =
  | "text"
  | "smartText"
  | "image"
  | "group"
  | "flexGroup"
  | "rect"
  | "svg"
  | "customImage"
  | "characterImage"
  | "altCharacterImage"
  | "tournamentIcon"
  | "playerFlag";

export type Condition = DesignPlaceholder | RenderCondition;

export type ElementFilterConfig =
  | { type: "Grayscale" }
  | { type: "Sepia" }
  | { type: "RGB"; r: number; g: number; b: number }
  | { type: "Blur"; radius: number }
  | { type: "Brightness"; brightness: number };

export type FlexAlign = "start" | "center" | "end";
export type FlexJustify = "start" | "center" | "end" | "space-between";
export type FlexDirection = "row" | "column";

export interface FlexItemConfig {
  shrink?: boolean;
  grow?: boolean;
  basis?: number;
}

interface BaseElementConfig {
  id?: string;
  position: { x: number; y: number };
  size?: { width?: number; height?: number };
  scale?: { x: number; y: number };
  rotation?: number;
  offset?: { x: number; y: number };
  clip?: boolean;
  name?: string;
  hidden?: boolean;
  conditions?: Condition[];
  selectable?: boolean;
  filterEffects?: ElementFilterConfig[];
  flex?: FlexItemConfig;
}

export interface TextElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Text>> {
  type: "text";
  text?: string;
  textId?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: string;
  fill?: string;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
  shadowOpacity?: number;
}

export interface SmartTextElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Text>> {
  type: "smartText";
  text?: string;
  textId?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: string;
  fill?: string;
  align?: HorizontalAlign;
  verticalAlign?: VerticalAlign;
  anchor?: Anchor;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
  shadowOpacity?: number;
}

export interface ImageElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Image>> {
  type: "image";
  src: string;
}

export interface GroupElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Group>> {
  type: "group";
  elements: ElementConfig[];
}

export interface FlexGroupElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Group>> {
  type: "flexGroup";
  elements: ElementConfig[];
  direction?: FlexDirection;
  gap?: number;
  align?: FlexAlign;
  justify?: FlexJustify;
  wrap?: boolean;
  wrapDirection?: "start" | "end";
}

export interface RectElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Rect>> {
  type: "rect";
  fill?: string;
  cornerRadius?: number | number[];
}

export interface CustomImageElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Image>> {
  type: "customImage";
  src: string;
  fillMode?: ImageFillMode;
  align?: ImageAlign;
}

export interface CharacterImageElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Image>> {
  type: "characterImage";
  usePlayerAvatar?: boolean;
  shadowEnabled?: boolean;
}

export interface AltCharacterImageElementConfig extends BaseElementConfig {
  type: "altCharacterImage";
  wrap?: boolean;
  wrapDirection?: "start" | "end";
  characterSizes?: number[];
  gap?: number;
  direction?: FlexDirection;
  align?: FlexAlign;
  justify?: FlexJustify;
}

export interface SvgElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Image>> {
  type: "svg";
  src: string;
  palette: Record<string, string>;
}

export interface TournamentIconElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Image>> {
  type: "tournamentIcon";
  fillMode?: ImageFillMode;
  align?: ImageAlign;
}

export interface BackgroundImageElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Image>> {
  type: "backgroundImage";
  fillMode?: ImageFillMode;
  align?: ImageAlign;
}

export interface PlayerFlagElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Image>> {
  type: "playerFlag";
  fillMode?: ImageFillMode;
  align?: ImageAlign;
}

export type ElementConfig =
  | TextElementConfig
  | SmartTextElementConfig
  | ImageElementConfig
  | GroupElementConfig
  | FlexGroupElementConfig
  | CharacterImageElementConfig
  | AltCharacterImageElementConfig
  | RectElementConfig
  | CustomImageElementConfig
  | SvgElementConfig
  | TournamentIconElementConfig
  | BackgroundImageElementConfig
  | PlayerFlagElementConfig;

export interface LayerDesign {
  elements: ElementConfig[];
}

export interface PlayerDesign extends BaseElementConfig {
  frame?: ImageElementConfig | SvgElementConfig | CustomImageElementConfig;
  elements: ElementConfig[];
  size: { width: number; height: number };
  scale: { x: number; y: number };
  position: { x: number; y: number };
}

export interface Design {
  canvasSize: { width: number; height: number };
  canvasDisplayScale: number;
  colorPalette?: Record<string, { color: string; name: string }>;
  textPalette?: Record<string, { text: string; name: string }>;
  bgAssetId?: string;
  background: LayerDesign;
  tournament: LayerDesign;
  basePlayer: PlayerDesign;
  players: Partial<PlayerDesign>[];
}
