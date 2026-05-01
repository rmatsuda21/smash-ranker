import { ThumbnailElement } from "@/types/thumbnail/ThumbnailDesign";
import { findElement, getTopLevelAncestorId } from "./elementTree";

export const expandSelectionToGroups = (
  ids: string[],
  elements: ThumbnailElement[],
): string[] => {
  const out = new Set<string>();
  for (const id of ids) {
    out.add(getTopLevelAncestorId(elements, id));
  }
  return Array.from(out);
};

export const getSelectedGroupIds = (
  ids: string[],
  elements: ThumbnailElement[],
): string[] => {
  const out: string[] = [];
  for (const id of ids) {
    const el = findElement(elements, id);
    if (el && el.type === "group") out.push(id);
  }
  return out;
};
