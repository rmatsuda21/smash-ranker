import { ThumbnailDesign } from "@/types/thumbnail/ThumbnailDesign";
import { DEFAULT_CANVAS_SIZE } from "@/consts/thumbnail/defaults";

export const blankTemplate = (): ThumbnailDesign => ({
  id: "blank",
  name: "Blank",
  canvasSize: { ...DEFAULT_CANVAS_SIZE },
  background: { type: "color", color: "#FFFFFF" },
  elements: [],
});
