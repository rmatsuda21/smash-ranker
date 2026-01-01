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
  | "rect"
  | "svg"
  | "customImage"
  | "characterImage"
  | "altCharacterImage"
  | "tournamentIcon";

export type Condition = DesignPlaceholder | RenderCondition;

export interface CanvasConfig {
  size: { width: number; height: number };
  displayScale: number;
  colorPalette?: Record<string, { color: string; name: string }>;
  textPalette?: Record<string, { text: string; name: string }>;
  bgAssetId?: string;
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
  fillMode?: ImageFillMode;
  align?: ImageAlign;
}

export interface CharacterImageElementConfig
  extends BaseElementConfig,
    Partial<ComponentProps<typeof Image>> {
  type: "characterImage";
  usePlayerAvatar?: boolean;
}

export interface AltCharacterImageElementConfig extends BaseElementConfig {
  type: "altCharacterImage";
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

export type ElementConfig =
  | TextElementConfig
  | SmartTextElementConfig
  | ImageElementConfig
  | GroupElementConfig
  | CharacterImageElementConfig
  | AltCharacterImageElementConfig
  | RectElementConfig
  | CustomImageElementConfig
  | SvgElementConfig
  | TournamentIconElementConfig
  | BackgroundImageElementConfig;

export interface LayerConfig {
  elements: ElementConfig[];
}

export interface PlayerConfig extends BaseElementConfig {
  frame?: ImageElementConfig | SvgElementConfig | CustomImageElementConfig;
  elements: ElementConfig[];
  size: { width: number; height: number };
  scale: { x: number; y: number };
  position: { x: number; y: number };
}

export interface Design {
  canvas: CanvasConfig;
  background: LayerConfig;
  tournament: LayerConfig;
  basePlayer: PlayerConfig;
  players: Partial<PlayerConfig>[];
}
