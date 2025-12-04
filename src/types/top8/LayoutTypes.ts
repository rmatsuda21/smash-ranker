import { ComponentProps } from "react";
import { Group, Image, Rect, Text } from "react-konva";

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

export interface CanvasConfig {
  size: { width: number; height: number };
  displayScale: number;
}

interface BaseElementConfig {
  position: { x: number; y: number };
  size?: { width?: number; height?: number };
  scale?: { x: number; y: number };
  rotation?: number;
  offset?: { x: number; y: number };
  clip?: boolean;
  name?: string;
}

export interface TextElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Text>> {
  type: "text";
  text: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: string;
  fill?: string;
  align?: "left" | "center" | "right";
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
  shadowOpacity?: number;
}

export interface SmartTextElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Text>> {
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
}

export interface RectElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Rect>> {
  type: "rect";
  fill?: string;
}

export interface CustomImageElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Image>> {
  type: "customImage";
  src: string;
}

export interface CharacterImageElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Image>> {
  type: "characterImage";
  customSrc?: string;
}

export interface AltCharacterImageElementConfig extends BaseElementConfig {
  type: "altCharacterImage";
}

export interface SvgElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Image>> {
  type: "svg";
  src: string;
  fillColorMain?: string;
  fillColorSecondary?: string;
}

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
export interface LayerConfig {
  elements: ElementConfig[];
}

export interface PlayerLayoutConfig extends BaseElementConfig {
  frame?: ImageElementConfig | SvgElementConfig | CustomImageElementConfig;
  elements: ElementConfig[];
  size: { width: number; height: number };
  scale: { x: number; y: number };
  position: { x: number; y: number };
}

export interface LayoutConfig {
  canvas: CanvasConfig;
  background: LayerConfig;
  tournament: LayerConfig;
  basePlayer: PlayerLayoutConfig;
  players: Partial<PlayerLayoutConfig>[];
}
