import type { ElementConfig } from "@/types/top8/Design";

/**
 * React key for a created element. Prefers the author-supplied `element.id`
 * (stable across renders, unique by design contract) and falls back to
 * `${type}-${index}` only when no id is provided.
 *
 * The `index` MUST be unique among the parent's children — i.e. the loop
 * index from a single `createKonvaElementsInternal` call over the parent's
 * full children array. Calling that function repeatedly with single-element
 * arrays would force `index=0` for every child and collapse all fallback
 * keys onto the same value, triggering React's duplicate-key warning.
 */
export const getElementKey = (
  element: Pick<ElementConfig, "id" | "type">,
  index: number,
): string => element.id ?? `${element.type}-${index}`;
