import { Group } from "react-konva";
import { ReactNode } from "react";
import { Text as KonvaText } from "konva/lib/shapes/Text";

import type {
  ElementConfig,
  TextElementConfig,
  SmartTextElementConfig,
  GroupElementConfig,
  FlexGroupElementConfig,
  FlexGridElementConfig,
  FlexAlign,
  FlexJustify,
} from "@/types/top8/Design";
import type { ElementCreator } from "@/types/top8/ElementFactory";
import { replacePlaceholders } from "@/utils/top8/replacePlaceholderString";
import { evaluateElementCondition } from "@/utils/top8/evaluateElementCondition";
import { resolveText } from "@/utils/top8/resolveText";
import type { InternalContext } from "../types";

let createKonvaElementsInternal: (
  elements: ElementConfig[],
  context: InternalContext
) => ReactNode[];

export const setCreateKonvaElementsInternal = (
  fn: typeof createKonvaElementsInternal
) => {
  createKonvaElementsInternal = fn;
};

interface FlexChildInfo {
  element: ElementConfig;
  originalIndex: number;
  mainSize: number;
  crossSize: number;
  isFlexible: boolean;
  flexGrow: boolean;
  flexShrink: boolean;
}

const getElementMainSize = (
  element: ElementConfig,
  direction: "row" | "column",
  context: InternalContext
): number => {
  const basis = element.flex?.basis;
  if (basis !== undefined) return basis;

  if (direction === "row") {
    if (element.type === "smartText" || element.type === "text") {
      const textEl = element as TextElementConfig | SmartTextElementConfig;
      const resolvedText = resolveText(
        textEl.textId,
        textEl.text,
        context.design?.textPalette
      );
      const text = replacePlaceholders(resolvedText, context);

      const tempText = new KonvaText({
        text: text,
        fontSize: textEl.fontSize ?? 20,
        fontFamily: context.fontFamily ?? "Arial",
        fontStyle: textEl.fontStyle ?? String(textEl.fontWeight ?? "normal"),
        width: textEl.size?.width,
        wrap: "word",
      });

      const measuredWidth = tempText.width();
      tempText.destroy();

      return measuredWidth;
    }

    return element.size?.width ?? 0;
  }

  if (element.size?.height === undefined) {
    if (element.type === "text" || element.type === "smartText") {
      const textEl = element as TextElementConfig | SmartTextElementConfig;
      return textEl.fontSize ?? 20;
    }
  }

  return element.size?.height ?? 0;
};

const getElementCrossSize = (
  element: ElementConfig,
  direction: "row" | "column"
): number => {
  if (direction === "row") {
    if (element.size?.height === undefined) {
      if (element.type === "text" || element.type === "smartText") {
        const textEl = element as TextElementConfig | SmartTextElementConfig;
        return textEl.fontSize ?? 20;
      }
    }
    return element.size?.height ?? 0;
  }
  return element.size?.width ?? 0;
};

const collectVisibleChildren = (
  elements: ElementConfig[],
  direction: "row" | "column",
  context: InternalContext
): FlexChildInfo[] =>
  elements.reduce<FlexChildInfo[]>((acc, child, i) => {
    if (child.hidden || !evaluateElementCondition(child.conditions, context)) {
      return acc;
    }
    acc.push({
      element: child,
      originalIndex: i,
      mainSize: getElementMainSize(child, direction, context),
      crossSize: getElementCrossSize(child, direction),
      isFlexible: !!(child.flex?.grow || child.flex?.shrink),
      flexGrow: !!child.flex?.grow,
      flexShrink: !!child.flex?.shrink,
    });
    return acc;
  }, []);

const buildFlexLines = (
  children: FlexChildInfo[],
  containerMainSize: number,
  gap: number,
  wrap: boolean
): FlexChildInfo[][] => {
  if (!wrap || containerMainSize <= 0) {
    return [children];
  }

  const lines: FlexChildInfo[][] = [];
  let currentLine: FlexChildInfo[] = [];
  let currentLineSize = 0;

  for (const child of children) {
    const sizeWithGap =
      currentLine.length > 0 ? gap + child.mainSize : child.mainSize;

    if (
      currentLine.length > 0 &&
      currentLineSize + sizeWithGap > containerMainSize
    ) {
      lines.push(currentLine);
      currentLine = [child];
      currentLineSize = child.mainSize;
    } else {
      currentLine.push(child);
      currentLineSize += sizeWithGap;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
};

const applyFlexSizing = (
  line: FlexChildInfo[],
  containerMainSize: number,
  gap: number
): number[] => {
  const sizes = line.map((child) => child.mainSize);
  const totalGaps = gap * (line.length - 1);
  const totalSize = sizes.reduce((sum, s) => sum + s, 0);
  const remainingSpace = containerMainSize - totalSize - totalGaps;

  if (remainingSpace === 0) return sizes;

  if (remainingSpace > 0) {
    // Grow
    const growCount = line.filter((c) => c.flexGrow).length;
    if (growCount > 0) {
      const extra = remainingSpace / growCount;
      line.forEach((child, i) => {
        if (child.flexGrow) sizes[i] += extra;
      });
    }
  } else {
    // Shrink
    const shrinkable = line.reduce(
      (acc, child, i) => (child.flexShrink ? acc + sizes[i] : acc),
      0
    );
    if (shrinkable > 0) {
      const shrinkAmount = Math.min(-remainingSpace, shrinkable);
      line.forEach((child, i) => {
        if (child.flexShrink) {
          sizes[i] = Math.max(
            0,
            sizes[i] - shrinkAmount * (sizes[i] / shrinkable)
          );
        }
      });
    }
  }

  return sizes;
};

const calculateJustifyOffset = (
  justify: FlexJustify,
  containerSize: number,
  contentSize: number,
  totalGaps: number,
  itemCount: number
): { offset: number; spaceBetween: number } => {
  const freeSpace = containerSize - contentSize - totalGaps;

  switch (justify) {
    case "center":
      return { offset: freeSpace / 2, spaceBetween: 0 };
    case "end":
      return { offset: freeSpace, spaceBetween: 0 };
    case "space-between":
      return {
        offset: 0,
        spaceBetween:
          itemCount > 1 ? (containerSize - contentSize) / (itemCount - 1) : 0,
      };
    default:
      return { offset: 0, spaceBetween: 0 };
  }
};

const calculateAlignOffset = (
  align: FlexAlign,
  alignmentSize: number,
  childSize: number
): number => {
  switch (align) {
    case "center":
      return (alignmentSize - childSize) / 2;
    case "end":
      return alignmentSize - childSize;
    default:
      return 0;
  }
};

export const createGroupElement: ElementCreator<GroupElementConfig> = ({
  element,
  index,
  context,
}) => {
  const konvaElements = createKonvaElementsInternal(
    element.elements,
    context as InternalContext
  );

  return (
    <Group
      key={element.id ?? `group-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
    >
      {konvaElements}
    </Group>
  );
};

export const createFlexGroupElement: ElementCreator<FlexGroupElementConfig> = ({
  element,
  index,
  context,
}) => {
  const {
    direction = "row",
    gap = 0,
    align = "start",
    justify = "start",
    wrap = false,
    wrapDirection = "start",
  } = element;

  const isRow = direction === "row";
  const containerMainSize = isRow
    ? element.size?.width ?? 0
    : element.size?.height ?? 0;
  const containerCrossSize = isRow
    ? element.size?.height ?? 0
    : element.size?.width ?? 0;

  const visibleChildren = collectVisibleChildren(
    element.elements,
    direction,
    context as InternalContext
  );

  if (visibleChildren.length === 0) {
    return (
      <Group
        key={element.id ?? `flexGroup-${index}`}
        x={element.position.x}
        y={element.position.y}
        width={element.size?.width}
        height={element.size?.height}
      />
    );
  }

  const lines = buildFlexLines(visibleChildren, containerMainSize, gap, wrap);
  const orderedLines = wrapDirection === "end" ? [...lines].reverse() : lines;

  const positionedElements: ReactNode[] = [];
  let crossPosition = 0;

  for (const line of orderedLines) {
    const sizes = applyFlexSizing(line, containerMainSize, gap);
    const maxCrossSize = Math.max(...line.map((c) => c.crossSize), 0);
    const alignmentCrossSize =
      !wrap && containerCrossSize > 0 ? containerCrossSize : maxCrossSize;

    const totalGaps = gap * (line.length - 1);
    const totalContentSize = sizes.reduce((sum, s) => sum + s, 0);
    const { offset, spaceBetween } = calculateJustifyOffset(
      justify,
      containerMainSize,
      totalContentSize,
      totalGaps,
      line.length
    );

    let mainPosition = Math.max(0, offset);

    for (let i = 0; i < line.length; i++) {
      const child = line[i];
      const childMainSize = sizes[i];
      const alignOffset = calculateAlignOffset(
        align,
        alignmentCrossSize,
        child.crossSize
      );

      const modifiedElement: ElementConfig = {
        ...child.element,
        position: {
          x: isRow ? mainPosition : crossPosition + alignOffset,
          y: isRow ? crossPosition + alignOffset : mainPosition,
        },
        size: {
          ...child.element.size,
          ...(isRow ? { width: childMainSize } : { height: childMainSize }),
        },
      };

      positionedElements.push(
        ...createKonvaElementsInternal(
          [modifiedElement],
          context as InternalContext
        )
      );

      mainPosition += childMainSize + (spaceBetween || gap);
    }

    crossPosition += maxCrossSize + gap;
  }

  return (
    <Group
      key={element.id ?? `flexGroup-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
    >
      {positionedElements}
    </Group>
  );
};

interface GridDimensions {
  rows: number;
  columns: number;
  cellWidth: number;
  cellHeight: number;
  fillRatio: number;
}

const calculateOptimalGrid = (
  numChildren: number,
  containerWidth: number,
  containerHeight: number,
  columnGap: number,
  rowGap: number,
  fixedColumns?: number,
  fixedRows?: number,
  aspectRatio?: number
): GridDimensions => {
  if (numChildren === 0) {
    return { rows: 0, columns: 0, cellWidth: 0, cellHeight: 0, fillRatio: 0 };
  }

  const calculateCellSize = (
    rows: number,
    cols: number
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
    cellHeight: number
  ): number => {
    const usedCells = Math.min(numChildren, rows * cols);
    const totalCellArea = cellWidth * cellHeight * usedCells;
    const containerArea = containerWidth * containerHeight;
    return totalCellArea / containerArea;
  };

  if (fixedColumns !== undefined && fixedRows !== undefined) {
    const { cellWidth, cellHeight } = calculateCellSize(
      fixedRows,
      fixedColumns
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
        cellHeight
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

const collectGridVisibleChildren = (
  elements: ElementConfig[],
  context: InternalContext
): { element: ElementConfig; originalIndex: number }[] =>
  elements.reduce<{ element: ElementConfig; originalIndex: number }[]>(
    (acc, child, i) => {
      if (
        child.hidden ||
        !evaluateElementCondition(child.conditions, context)
      ) {
        return acc;
      }
      acc.push({ element: child, originalIndex: i });
      return acc;
    },
    []
  );

const calculateGridAlignOffset = (
  align: FlexAlign,
  containerSize: number,
  contentSize: number
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

export const createFlexGridElement: ElementCreator<FlexGridElementConfig> = ({
  element,
  index,
  context,
}) => {
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
  } = element;

  const containerWidth = element.size?.width ?? 0;
  const containerHeight = element.size?.height ?? 0;

  const visibleChildren = collectGridVisibleChildren(
    element.elements,
    context as InternalContext
  );

  if (visibleChildren.length === 0) {
    return (
      <Group
        key={element.id ?? `flexGrid-${index}`}
        x={element.position.x}
        y={element.position.y}
        width={containerWidth}
        height={containerHeight}
      />
    );
  }

  const grid = calculateOptimalGrid(
    visibleChildren.length,
    containerWidth,
    containerHeight,
    columnGap,
    rowGap,
    fixedColumns,
    fixedRows,
    aspectRatio
  );

  const gridContentWidth =
    grid.columns * grid.cellWidth + (grid.columns - 1) * columnGap;
  const gridContentHeight =
    grid.rows * grid.cellHeight + (grid.rows - 1) * rowGap;

  const gridOffsetX = calculateGridAlignOffset(
    justify,
    containerWidth,
    gridContentWidth
  );
  const gridOffsetY = calculateGridAlignOffset(
    align,
    containerHeight,
    gridContentHeight
  );

  const lastRowItemCount =
    visibleChildren.length % grid.columns || grid.columns;
  const isLastRowFull = lastRowItemCount === grid.columns;

  const positionedElements: ReactNode[] = [];

  for (let i = 0; i < visibleChildren.length; i++) {
    const child = visibleChildren[i];
    const row = Math.floor(i / grid.columns);
    const col = i % grid.columns;
    const isLastRow = row === grid.rows - 1;

    let x = col * (grid.cellWidth + columnGap);
    const y = row * (grid.cellHeight + rowGap);

    if (isLastRow && !isLastRowFull) {
      const lastRowWidth =
        lastRowItemCount * grid.cellWidth + (lastRowItemCount - 1) * columnGap;
      const lastRowOffset = calculateGridAlignOffset(
        alignLastRow,
        gridContentWidth,
        lastRowWidth
      );
      x += lastRowOffset;
    }

    const finalX = gridOffsetX + x;
    const finalY = gridOffsetY + y;

    const modifiedElement: ElementConfig = {
      ...child.element,
      position: { x: finalX, y: finalY },
      size: {
        ...child.element.size,
        width: grid.cellWidth,
        height: grid.cellHeight,
      },
    };

    positionedElements.push(
      ...createKonvaElementsInternal(
        [modifiedElement],
        context as InternalContext
      )
    );
  }

  return (
    <Group
      key={element.id ?? `flexGrid-${index}`}
      x={element.position.x}
      y={element.position.y}
      width={containerWidth}
      height={containerHeight}
    >
      {positionedElements}
    </Group>
  );
};
