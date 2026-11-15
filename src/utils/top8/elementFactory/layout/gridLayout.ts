/**
 * Grid math for `flexGrid` elements and the character grids built on it.
 * Pure functions: element configs and numbers in, positions and sizes out.
 */
import type {
  ElementConfig,
  FlexAlign,
  FlexGridElementConfig,
} from "@/types/top8/Design";
import type { ElementFactoryContext } from "@/types/top8/ElementFactory";
import { evaluateElementCondition } from "@/utils/top8/evaluateElementCondition";

/**
 * Sizing strategy for grids of square cells that should be as large as
 * possible (character icon grids): the column count that maximizes the cell
 * size for `numItems` within the container.
 */
export const findOptimalSquareGrid = (
  numItems: number,
  containerWidth: number,
  containerHeight: number,
  columnGap: number,
  rowGap: number,
): { columns: number; cellSize: number } => {
  let bestColumns = 1;
  let bestCellSize = 0;

  for (let cols = 1; cols <= numItems; cols++) {
    const rows = Math.ceil(numItems / cols);
    const maxCellWidth = (containerWidth - (cols - 1) * columnGap) / cols;
    const maxCellHeight = (containerHeight - (rows - 1) * rowGap) / rows;
    const cellSize = Math.min(maxCellWidth, maxCellHeight);

    if (cellSize < 10) continue;

    if (cellSize > bestCellSize) {
      bestCellSize = cellSize;
      bestColumns = cols;
    }
  }

  return { columns: bestColumns, cellSize: bestCellSize };
};

interface GridDimensions {
  rows: number;
  columns: number;
  cellWidth: number;
  cellHeight: number;
  fillRatio: number;
}

/**
 * Sizing strategy for `flexGrid`: honours fixed `columns`/`rows` when given,
 * otherwise picks the row count that best fills the container while keeping
 * cells close to `aspectRatio`.
 */
const calculateOptimalGrid = (
  numChildren: number,
  containerWidth: number,
  containerHeight: number,
  columnGap: number,
  rowGap: number,
  fixedColumns?: number,
  fixedRows?: number,
  aspectRatio?: number,
): GridDimensions => {
  if (numChildren === 0) {
    return { rows: 0, columns: 0, cellWidth: 0, cellHeight: 0, fillRatio: 0 };
  }

  const calculateCellSize = (
    rows: number,
    cols: number,
  ): { cellWidth: number; cellHeight: number } => {
    const totalColumnGaps = (cols - 1) * columnGap;
    const totalRowGaps = (rows - 1) * rowGap;

    const maxCellWidth = (containerWidth - totalColumnGaps) / cols;
    const maxCellHeight = (containerHeight - totalRowGaps) / rows;

    if (aspectRatio === undefined || aspectRatio <= 0) {
      return { cellWidth: maxCellWidth, cellHeight: maxCellHeight };
    }

    const cellByWidth = {
      width: maxCellWidth,
      height: maxCellWidth / aspectRatio,
    };

    const cellByHeight = {
      width: maxCellHeight * aspectRatio,
      height: maxCellHeight,
    };

    if (cellByWidth.height <= maxCellHeight) {
      return { cellWidth: cellByWidth.width, cellHeight: cellByWidth.height };
    } else {
      return { cellWidth: cellByHeight.width, cellHeight: cellByHeight.height };
    }
  };

  const calculateFillRatio = (
    rows: number,
    cols: number,
    cellWidth: number,
    cellHeight: number,
  ): number => {
    const usedCells = Math.min(numChildren, rows * cols);
    const totalCellArea = cellWidth * cellHeight * usedCells;
    const containerArea = containerWidth * containerHeight;
    return totalCellArea / containerArea;
  };

  if (fixedColumns !== undefined && fixedRows !== undefined) {
    const { cellWidth, cellHeight } = calculateCellSize(
      fixedRows,
      fixedColumns,
    );
    return {
      rows: fixedRows,
      columns: fixedColumns,
      cellWidth,
      cellHeight,
      fillRatio: calculateFillRatio(
        fixedRows,
        fixedColumns,
        cellWidth,
        cellHeight,
      ),
    };
  }

  if (fixedColumns !== undefined) {
    const rows = Math.ceil(numChildren / fixedColumns);
    const { cellWidth, cellHeight } = calculateCellSize(rows, fixedColumns);
    return {
      rows,
      columns: fixedColumns,
      cellWidth,
      cellHeight,
      fillRatio: calculateFillRatio(rows, fixedColumns, cellWidth, cellHeight),
    };
  }

  if (fixedRows !== undefined) {
    const cols = Math.ceil(numChildren / fixedRows);
    const { cellWidth, cellHeight } = calculateCellSize(fixedRows, cols);
    return {
      rows: fixedRows,
      columns: cols,
      cellWidth,
      cellHeight,
      fillRatio: calculateFillRatio(fixedRows, cols, cellWidth, cellHeight),
    };
  }

  const targetAspectRatio = aspectRatio ?? 1;

  let bestGrid: GridDimensions = {
    rows: 1,
    columns: numChildren,
    cellWidth: 0,
    cellHeight: 0,
    fillRatio: 0,
  };
  let bestScore = -Infinity;

  for (let rows = 1; rows <= numChildren; rows++) {
    const cols = Math.ceil(numChildren / rows);

    if (rows * cols - numChildren >= cols) continue;

    const { cellWidth, cellHeight } = calculateCellSize(rows, cols);

    if (cellWidth <= 0 || cellHeight <= 0) continue;

    const cellAspectRatio = cellWidth / cellHeight;
    const aspectRatioScore =
      1 - Math.abs(Math.log(cellAspectRatio / targetAspectRatio));

    const fillRatio = calculateFillRatio(rows, cols, cellWidth, cellHeight);

    const score = fillRatio * 0.7 + aspectRatioScore * 0.3;

    if (score > bestScore) {
      bestScore = score;
      bestGrid = { rows, columns: cols, cellWidth, cellHeight, fillRatio };
    }
  }

  return bestGrid;
};

/** Offset that aligns content of `contentSize` inside `containerSize`. */
export const calculateGridAlignOffset = (
  align: FlexAlign,
  containerSize: number,
  contentSize: number,
): number => {
  switch (align) {
    case "center":
      return (containerSize - contentSize) / 2;
    case "end":
      return containerSize - contentSize;
    default:
      return 0;
  }
};

type GridCellPlacement = {
  count: number;
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  columnGap: number;
  rowGap: number;
  /** Alignment of a partly filled last row (or last column in column flow). */
  alignLastRow: FlexAlign;
  flow?: "row" | "column";
};

/**
 * Top-left corner of each cell, relative to the grid content's origin.
 *
 * Row flow fills left-to-right, then top-to-bottom. Column flow fills
 * top-to-bottom starting from the rightmost column, then adds columns to the
 * left.
 */
export const placeGridCells = ({
  count,
  columns,
  rows,
  cellWidth,
  cellHeight,
  columnGap,
  rowGap,
  alignLastRow,
  flow = "row",
}: GridCellPlacement): { x: number; y: number }[] => {
  const isColumnFlow = flow === "column";
  const contentWidth = columns * cellWidth + (columns - 1) * columnGap;
  const contentHeight = rows * cellHeight + (rows - 1) * rowGap;

  // The group that may be partly filled: the last row, or in column flow the
  // last column.
  const groupSize = isColumnFlow ? rows : columns;
  const lastGroupCount = count % groupSize || groupSize;
  const isLastGroupFull = lastGroupCount === groupSize;

  const lastRowOffset = calculateGridAlignOffset(
    alignLastRow,
    contentWidth,
    lastGroupCount * cellWidth + (lastGroupCount - 1) * columnGap,
  );
  const lastColumnOffset = calculateGridAlignOffset(
    alignLastRow,
    contentHeight,
    lastGroupCount * cellHeight + (lastGroupCount - 1) * rowGap,
  );

  return Array.from({ length: count }, (_, i) => {
    const row = isColumnFlow ? i % rows : Math.floor(i / columns);
    const logicalColumn = isColumnFlow ? Math.floor(i / rows) : i % columns;
    // Column flow starts on the right.
    const column = isColumnFlow ? columns - 1 - logicalColumn : logicalColumn;

    let x = column * (cellWidth + columnGap);
    let y = row * (cellHeight + rowGap);

    if (!isLastGroupFull) {
      if (!isColumnFlow && row === rows - 1) x += lastRowOffset;
      if (isColumnFlow && logicalColumn === columns - 1) y += lastColumnOffset;
    }

    return { x, y };
  });
};

/**
 * Lays out a `flexGrid`'s visible children: each comes back as a copy with
 * its position and size set to its cell.
 */
export const layoutGridChildren = (
  element: FlexGridElementConfig,
  context: ElementFactoryContext,
): ElementConfig[] => {
  const {
    gap = 0,
    rowGap = gap,
    columnGap = gap,
    columns: fixedColumns,
    rows: fixedRows,
    aspectRatio,
    align = "start",
    justify = "start",
    alignLastRow = "start",
    flow = "row",
  } = element;

  const containerWidth = element.size?.width ?? 0;
  const containerHeight = element.size?.height ?? 0;

  const visibleChildren = element.elements.filter(
    (child) =>
      !child.hidden && evaluateElementCondition(child.conditions, context),
  );
  if (visibleChildren.length === 0) return [];

  const grid = calculateOptimalGrid(
    visibleChildren.length,
    containerWidth,
    containerHeight,
    columnGap,
    rowGap,
    fixedColumns,
    fixedRows,
    aspectRatio,
  );

  const contentWidth =
    grid.columns * grid.cellWidth + (grid.columns - 1) * columnGap;
  const contentHeight = grid.rows * grid.cellHeight + (grid.rows - 1) * rowGap;
  const offsetX = calculateGridAlignOffset(
    justify,
    containerWidth,
    contentWidth,
  );
  const offsetY = calculateGridAlignOffset(
    align,
    containerHeight,
    contentHeight,
  );

  const cells = placeGridCells({
    count: visibleChildren.length,
    columns: grid.columns,
    rows: grid.rows,
    cellWidth: grid.cellWidth,
    cellHeight: grid.cellHeight,
    columnGap,
    rowGap,
    alignLastRow,
    flow,
  });

  return visibleChildren.map((child, i) => ({
    ...child,
    position: { x: offsetX + cells[i].x, y: offsetY + cells[i].y },
    size: { ...child.size, width: grid.cellWidth, height: grid.cellHeight },
  }));
};
