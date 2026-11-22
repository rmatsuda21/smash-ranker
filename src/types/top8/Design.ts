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
  | "polygon"
  | "pattern"
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

export type Point = { x: number; y: number };

/**
 * Colour treatment baked into an image when it loads, so it costs nothing per
 * frame and has no size limit (unlike `filterEffects`, which the mobile
 * profile skips for large elements). `contrast` and `brightness` are
 * multipliers: 1 leaves the image unchanged.
 */
export interface ImageTone {
  grayscale?: boolean;
  contrast?: number;
  brightness?: number;
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
  /** Degrees, about the element's position (its top-left corner). */
  rotation?: number;
  /** Shear factors (Konva `skewX`/`skewY`): 0.2 leans the element by 20% of
   *  its height. */
  skew?: { x?: number; y?: number };
  offset?: { x: number; y: number };
  clip?: boolean;
  /** Clips the element to this polygon, given in the element's own
   *  coordinate space. Takes the place of `clip`. */
  clipPoints?: Point[];
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
  /**
   * A column of the design's `playerTable`. The element is as wide as the
   * column, its `position.x` counts from the column's left edge, and it is
   * hidden when the column is left out. Top-level player and tournament
   * elements only.
   */
  column?: string;
}

export interface TextElementConfig
  extends BaseElementConfig, Partial<ComponentProps<typeof Text>> {
  type: "text";
  text?: string;
  textId?: string;
  fontSize?: number;
  /** With a fixed width: the font shrinks until the wrapped lines are no
   *  taller than this. */
  maxHeight?: number;
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
  /** What text wider than its box does: get smaller (the default), or keep
   *  its size and end in an ellipsis. */
  overflow?: "shrink" | "ellipsis";
  /** Shrinking stops at this size; text still too wide is cut with an
   *  ellipsis. Without it text shrinks as far as it has to. */
  minFontSize?: number;
  /** A filled box behind the text that is as wide as the text itself (at
   *  the size it was fitted to) plus `padding`: a label or name tab. */
  background?: TextBackground;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
  shadowOpacity?: number;
}

export interface TextBackground {
  /** Hex, rgba, or palette key. */
  fill: string;
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
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
  /** Children take the container's cross size (a column's width, a row's
   *  height) in place of their own, so text in a column can shrink to fit. */
  stretch?: boolean;
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
  extends
    BaseElementConfig,
    Omit<Partial<ComponentProps<typeof Rect>>, "fill"> {
  type: "rect";
  fill?: string | GradientConfig;
  cornerRadius?: number | number[];
  /** Hex, rgba, or palette key. With a blur and no offset, a glow. */
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
  shadowOpacity?: number;
  opacity?: number;
}

/** A closed shape through `points`, relative to the element's position. */
export interface PolygonElementConfig extends BaseElementConfig {
  type: "polygon";
  points: Point[];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  lineJoin?: "miter" | "round" | "bevel";
}

/**
 * A screentone filling the element's box.
 * - `dots`: a grid of dots `spacing` apart, each of radius `weight`.
 * - `lines`: parallel lines `spacing` apart, `weight` thick.
 * - `burst`: `rays` wedges radiating from `center`; `weight` (0–1) is the
 *   share of the circle they cover.
 * - `brick`: the mortar lines of a running-bond wall, courses `spacing`
 *   tall and `weight` thick.
 */
export interface PatternElementConfig extends BaseElementConfig {
  type: "pattern";
  pattern: "dots" | "lines" | "burst" | "brick";
  /** Hex, rgba, or palette key. */
  color?: string;
  opacity?: number;
  spacing?: number;
  weight?: number;
  /** Degrees. Rotates the dot grid or the lines. */
  angle?: number;
  /** Burst only: normalized centre (0–1), defaults to the middle. */
  center?: Point;
  /** Burst only. */
  rays?: number;
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
  /** `stock` draws the character's small head icon instead of the render,
   *  uncropped. Defaults to `render`. */
  imageType?: "stock" | "render";
  /** Show the whole render instead of the character's stored close-up
   *  crop. `cropScaleMultiplier` still applies. */
  uncropped?: boolean;
  /** Where art that does not fill its box sits in it. Defaults to the
   *  centre. */
  align?: ImageAlign;
  tone?: ImageTone;
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
  /**
   * Inside a wrapping row `flexGroup`: each character becomes a flex item of
   * its own (sized by `elementTemplate`), so the icons continue the line
   * after their siblings and wrap with it instead of forming a grid.
   */
  inline?: boolean;
  /** Draw only the character at this index (set by the inline expansion). */
  characterIndex?: number;
  elementTemplate?: ElementConfig;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  columns?: number;
  rows?: number;
  align?: FlexAlign;
  justify?: FlexAlign;
  alignLastRow?: FlexAlign;
  /**
   * With an `elementTemplate` and `rows`: `column` stacks the characters
   * top to bottom, `rows` to a column, starting at the right edge of the box
   * and adding columns to the left. Cells keep the template's size unless
   * `rows` of them are taller than the box.
   */
  flow?: FlexGridFlow;
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
  | PolygonElementConfig
  | PatternElementConfig
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
  colorPalette?: Record<
    string,
    { color: string; name: string; group?: string }
  >;
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
  dynamicPlayerHeight?: DynamicPlayerHeight;
  /**
   * Height the layout sets aside for the tournament icon, above the players.
   * A tournament without an icon gets that space back: players move up and
   * the canvas gets shorter by this much.
   */
  tournamentIconSpace?: number;
  /**
   * When set, the number of player slots can be changed in the Players tab.
   * Slots are a vertical stack: one is added under the last, and the canvas
   * and full-height background rects change height with them.
   */
  dynamicPlayerCount?: DynamicPlayerCount;
  /**
   * When set, the players are the rows of a table whose column widths depend
   * on what the players have in them. Elements join a column with `column`.
   */
  playerTable?: PlayerTable;
}

export interface TableColumn {
  id: string;
  /**
   * A fixed width, or the range for a column that is as wide as its widest
   * cell. Both include the gap that follows the column.
   */
  width: number | { min: number; max: number };
  /** Takes the room the other columns leave, past its own maximum if there
   *  is any. One per table. */
  grow?: boolean;
  /** Left out, with its header, when no player has anything in it. */
  optional?: boolean;
  /** `center`: in a column wider than its widest cell, the cells move in
   *  together so that the widest one is centred. The header stays put. */
  align?: "start" | "center";
}

export interface PlayerTable {
  width: number;
  /** Space kept clear at the right of every column. */
  gap: number;
  /** Left to right. When they don't all fit, the columns other than the
   *  `grow` one narrow to their minimum, the last one first. */
  columns: TableColumn[];
}

export interface DynamicPlayerCount {
  /** Distance from the top of one slot to the top of the next. */
  slotPitch: number;
  min: number;
  max: number;
  /**
   * What the slot at each index adds to `basePlayer` (e.g. podium styling),
   * so a removed slot gets it back when it is added again.
   */
  slotOverrides?: Partial<PlayerDesign>[];
}

export type DynamicPlayerHeight =
  /** A character grid with a fixed number of icons per row. */
  | { rowHeight: number; gap: number; maxPerRow: number }
  /**
   * A wrapping row `flexGroup` (found by id in the player's elements) whose
   * line count depends on the player's content. The player grows by however
   * much taller than its configured height the group lays out, and so do the
   * player's top-level elements that span its full height.
   */
  | { wrapGroupId: string };
