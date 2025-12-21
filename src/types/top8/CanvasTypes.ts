import { CanvasColors } from "@/consts/top8/CanvasColors";

export interface CanvasConfig {
  backgroundColor?: string;
  selection?: boolean;
  displayScale: number;
  size: { width: number; height: number };
}

export type CanvasTheme = Record<CanvasColors, string>;
