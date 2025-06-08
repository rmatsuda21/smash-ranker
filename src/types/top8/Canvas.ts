import { CanvasColors } from "@/consts/top8/CanvasColors";
import { FabricObject, TEvent, TPointerEvent } from "fabric";

export type CanvasConfig = {
  width: number;
  height: number;
  backgroundColor?: string;
  selection?: boolean;
};

export type CanvasEvents = {
  onPlayerSelected: (
    e: Partial<TEvent<TPointerEvent>> & { selected: FabricObject[] }
  ) => void;
  onPlayerCleared: () => void;
};

export type CanvasTheme = Record<CanvasColors, string>;
