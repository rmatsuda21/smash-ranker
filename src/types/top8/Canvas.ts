import { CanvasColors } from "@/consts/top8/CanvasColors";

export type CanvasConfig = {
  width: number;
  height: number;
  backgroundColor?: string;
  selection?: boolean;
};

export type CanvasTheme = Record<CanvasColors, string>;
