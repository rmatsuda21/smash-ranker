import { type ComponentProps } from "react";
import { Group, Image, Rect, Text } from "react-konva";

import { DesignPlaceholder } from "@/consts/top8/placeholders";
import { RenderCondition } from "@/consts/top8/renderConditions";
import { type GradientConfig } from "@/types/top8/Gradient";

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
  | "flexGrid"
  | "rect"
  | "svg"
  | "customImage"
  | "characterImage"
  | "altCharacterImage"
  | "customAltCharacterImage"
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
  size?: {
    width?: number;
    height?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  scale?: { x: number; y: number };
  rotation?: number;
  offset?: { x: number; y: number };
  clip?: boolean;
  clipCornerRadius?: number;
  /** Extend clip bounds beyond the container in specific directions (pixels). */
  clipOffset?: { top?: number; right?: number; bottom?: number; left?: number };
  name?: string;
  hidden?: boolean;
  conditions?: Condition[];
  selectable?: boolean;
  filterEffects?: ElementFilterConfig[];
  flex?: FlexItemConfig;
  textTransform?: "uppercase" | "lowercase";
}

export interface TextElementConfig
  extends BaseElementConfig, Partial<ComponentProps<typeof Text>> {
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
  extends BaseElementConfig, Partial<ComponentProps<typeof Text>> {
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
  extends BaseElementConfig, Partial<ComponentProps<typeof Image>> {
  type: "image";
  src: string;
}

export interface GroupElementConfig
  extends BaseElementConfig, Partial<ComponentProps<typeof Group>> {
  type: "group";
  elements: ElementConfig[];
}

export interface FlexGroupElementConfig
  extends BaseElementConfig, Partial<ComponentProps<typeof Group>> {
  type: "flexGroup";
  elements: ElementConfig[];
  direction?: FlexDirection;
  gap?: number;
  align?: FlexAlign;
  justify?: FlexJustify;
  wrap?: boolean;
  wrapDirection?: "start" | "end";
}

export type FlexGridFlow = "row" | "column";

export interface FlexGridElementConfig
  extends BaseElementConfig, Partial<ComponentProps<typeof Group>> {
  type: "flexGrid";
  elements: ElementConfig[];
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  columns?: number;
  rows?: number;
  aspectRatio?: number;
  align?: FlexAlign;
  justify?: FlexAlign;
  alignLastRow?: FlexAlign;
  /** Item flow direction. "row" (default): fill left-to-right then top-to-bottom. "column": fill top-to-bottom then left-to-right. */
  flow?: FlexGridFlow;
}

export interface RectElementConfig
  extends BaseElementConfig,
    Omit<Partial<ComponentProps<typeof Rect>>, "fill"> {
  type: "rect";
  fill?: string | GradientConfig;
  cornerRadius?: number | number[];
}

export interface CustomImageElementConfig
  extends BaseElementConfig, Partial<ComponentProps<typeof Image>> {
  type: "customImage";
  src: string;
  fillMode?: ImageFillMode;
  align?: ImageAlign;
}

export interface CharacterImageElementConfig
  extends BaseElementConfig, Partial<ComponentProps<typeof Image>> {
  type: "characterImage";
  usePlayerAvatar?: boolean;
  shadowEnabled?: boolean;
  fillMode?: ImageFillMode;
  cropScaleMultiplier?: number;
}

export interface AltCharacterImageElementConfig extends BaseElementConfig {
  type: "altCharacterImage";
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  columns?: number;
  rows?: number;
  align?: FlexAlign;
  justify?: FlexAlign;
  alignLastRow?: FlexAlign;
  flow?: FlexGridFlow;
}

export type CharacterImageType = "stock" | "render";

export interface CustomAltCharacterImageElementConfig extends BaseElementConfig {
  type: "customAltCharacterImage";
  imageType?: CharacterImageType;
  /** When true, include the main character as the first grid item. */
  includeMainCharacter?: boolean;
  elementTemplate?: ElementConfig;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  columns?: number;
  rows?: number;
  align?: FlexAlign;
  justify?: FlexAlign;
  alignLastRow?: FlexAlign;
}

export interface SvgElementConfig
  extends BaseElementConfig, Partial<ComponentProps<typeof Image>> {
  type: "svg";
  src: string;
  palette: Record<string, string>;
}

export interface TournamentIconElementConfig
  extends BaseElementConfig, Partial<ComponentProps<typeof Image>> {
  type: "tournamentIcon";
  fillMode?: ImageFillMode;
  align?: ImageAlign;
}

export interface BackgroundImageElementConfig
  extends BaseElementConfig, Partial<ComponentProps<typeof Image>> {
  type: "backgroundImage";
  fillMode?: ImageFillMode;
  align?: ImageAlign;
}

export interface PlayerFlagElementConfig
  extends BaseElementConfig, Partial<ComponentProps<typeof Image>> {
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
  | FlexGridElementConfig
  | CharacterImageElementConfig
  | AltCharacterImageElementConfig
  | CustomAltCharacterImageElementConfig
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
  colorPalette?: Record<string, { color: string; name: string; group?: string }>;
  textPalette?: Record<string, { text: string; name: string }>;
  bgAssetId?: string;
  bgImageDarkness?: number;
  background: LayerDesign;
  tournament: LayerDesign;
  basePlayer: PlayerDesign;
  players: Partial<PlayerDesign>[];
  name: string;
  author?: string;
  /** Render 1st-place player on top (last in draw order). */
  reversePlayerZOrder?: boolean;
  /** When set, player cards grow taller to accommodate extra character icon rows. */
  dynamicPlayerHeight?: {
    rowHeight: number;
    gap: number;
    maxPerRow: number;
  };
}
