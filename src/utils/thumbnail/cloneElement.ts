import { ThumbnailElement } from "@/types/thumbnail/ThumbnailDesign";
import { uuid } from "./uuid";

const NUDGE = 24;

export const cloneElement = (element: ThumbnailElement): ThumbnailElement => {
  return {
    ...element,
    id: uuid(),
    x: element.x + NUDGE,
    y: element.y + NUDGE,
    name: element.name ? `${element.name} copy` : undefined,
  } as ThumbnailElement;
};
