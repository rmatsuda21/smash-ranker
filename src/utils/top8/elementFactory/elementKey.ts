import type { ElementConfig } from "@/types/top8/Design";

/**
 * React key for an element. Prefers the author-supplied `element.id` (stable
 * across renders, unique by design contract) and falls back to
 * `${type}-${index}` when there is none.
 *
 * The `index` must be unique among the parent's children, which is why
 * containers render all their children through a single `ElementList`.
 */
export const getElementKey = (
  element: Pick<ElementConfig, "id" | "type">,
  index: number,
): string => element.id ?? `${element.type}-${index}`;
