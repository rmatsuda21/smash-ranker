/**
 * Column widths for designs that lay their players out as a table
 * (`Design.playerTable`). A column's width can depend on every player, so it
 * is worked out here, before anything renders, and written into the elements
 * that name the column.
 */
import type {
  ElementConfig,
  PlayerDesign,
  PlayerTable,
} from "@/types/top8/Design";
import type { PlayerInfo } from "@/types/top8/Player";
import { evaluateElementCondition } from "@/utils/top8/evaluateElementCondition";
import { getElementMainSize } from "@/utils/top8/elementFactory/layout/measureElement";

/** Where each column ended up, by id. `null`: left out of the table.
 *  `inset` is how far the cells start from the column's left edge. */
export type TableLayout = Record<
  string,
  { x: number; width: number; inset: number } | null
>;

/** Width of what one player has in a column, ignoring the cell's own box. */
const measureCell = (
  config: PlayerDesign,
  columnId: string,
  player: PlayerInfo,
  fontFamily: string | undefined,
): number => {
  const context = { player, fontFamily };

  return config.elements.reduce((widest, element) => {
    if (element.column !== columnId || element.hidden) return widest;
    if (!evaluateElementCondition(element.conditions, context)) return widest;

    // Without a width, text measures as its own width and a row as the sum
    // of its children.
    const unboxed = {
      ...element,
      size: { ...element.size, width: undefined, maxWidth: Infinity },
    } as ElementConfig;

    return Math.max(widest, getElementMainSize(unboxed, "row", context));
  }, 0);
};

/**
 * Lays the table's columns out for the players that occupy a slot.
 *
 * Fixed columns take their width. A ranged column is as wide as its widest
 * cell, within its range; the `grow` column is served first and then takes
 * whatever room is left. When the columns don't all fit, the others give up
 * width down to their minimum, starting from the last.
 *
 * In an `align: "center"` column wider than its widest cell, the cells are
 * inset so that the widest one is centred; they still share a left edge.
 */
export const layoutPlayerTable = (
  table: PlayerTable,
  configs: PlayerDesign[],
  players: PlayerInfo[],
  fontFamily?: string,
): TableLayout => {
  const count = Math.min(configs.length, players.length);

  const columns = table.columns.flatMap((column) => {
    let content = 0;
    if (
      column.optional ||
      column.align === "center" ||
      typeof column.width !== "number"
    ) {
      for (let i = 0; i < count; i++) {
        content = Math.max(
          content,
          measureCell(configs[i], column.id, players[i], fontFamily),
        );
      }
    }
    if (column.optional && content === 0) return [];

    if (typeof column.width === "number") {
      return [{ column, content, width: column.width, min: column.width }];
    }

    const { min, max } = column.width;
    const width = Math.min(max, Math.max(min, Math.ceil(content) + table.gap));
    return [{ column, content, width, min }];
  });

  let free = table.width - columns.reduce((sum, c) => sum + c.width, 0);
  const grower = columns.find((c) => c.column.grow);

  if (free < 0) {
    for (let i = columns.length - 1; i >= 0 && free < 0; i--) {
      const entry = columns[i];
      if (entry === grower) continue;
      const give = Math.min(entry.width - entry.min, -free);
      entry.width -= give;
      free += give;
    }
  }
  // Left over, or still short once every other column is at its minimum.
  if (grower) grower.width = Math.max(0, grower.width + free);

  const layout: TableLayout = {};
  for (const column of table.columns) layout[column.id] = null;

  let x = 0;
  for (const { column, content, width } of columns) {
    const inset =
      column.align === "center"
        ? Math.max(0, (width - table.gap - content) / 2)
        : 0;
    layout[column.id] = { x, width, inset };
    x += width;
  }
  return layout;
};

/** Moves and sizes the elements that name a column; an element whose column
 *  was left out is hidden. An element's own x is kept as an offset from the
 *  column's left edge. `cells` is for the players' elements, which follow
 *  the column's inset; headers stay at its left edge. Returns the same array
 *  when nothing names a column. */
export const placeInColumns = (
  elements: ElementConfig[],
  layout: TableLayout,
  gap: number,
  cells = false,
): ElementConfig[] => {
  if (!elements.some((element) => element.column !== undefined)) {
    return elements;
  }

  return elements.map((element) => {
    if (element.column === undefined) return element;

    const placed = layout[element.column];
    if (!placed) return { ...element, hidden: true };

    const inset = cells ? placed.inset : 0;

    return {
      ...element,
      position: {
        ...element.position,
        x: element.position.x + placed.x + inset,
      },
      size: {
        ...element.size,
        width: Math.max(0, placed.width - gap - inset),
      },
    } as ElementConfig;
  });
};
