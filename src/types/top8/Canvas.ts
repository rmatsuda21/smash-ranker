import { CanvasColors } from "@/consts/top8/CanvasColors";

export type CanvasConfig = {
  backgroundColor?: string;
  selection?: boolean;
  displayScale: number;
  size: { width: number; height: number };
};

export type CanvasTheme = Record<CanvasColors, string>;
