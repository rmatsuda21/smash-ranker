/**
 * Flexbox-style layout for `flexGroup` elements. Pure functions: element
 * configs in, positioned element configs out.
 */
import type {
  ElementConfig,
  FlexAlign,
  FlexGroupElementConfig,
  FlexJustify,
} from "@/types/top8/Design";
import type { ElementFactoryContext } from "@/types/top8/ElementFactory";
import { evaluateElementCondition } from "@/utils/top8/evaluateElementCondition";

import { getElementCrossSize, getElementMainSize } from "./measureElement";

interface FlexChildInfo {
  element: ElementConfig;
  originalIndex: number;
  mainSize: number;
  crossSize: number;
  isFlexible: boolean;
  flexGrow: boolean;
  flexShrink: boolean;
}

const collectVisibleChildren = (
  elements: ElementConfig[],
  direction: "row" | "column",
  context: ElementFactoryContext,
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
  wrap: boolean,
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
  gap: number,
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
      0,
    );
    if (shrinkable > 0) {
      const shrinkAmount = Math.min(-remainingSpace, shrinkable);
      line.forEach((child, i) => {
        if (child.flexShrink) {
          sizes[i] = Math.max(
            0,
            sizes[i] - shrinkAmount * (sizes[i] / shrinkable),
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
  itemCount: number,
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
  childSize: number,
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

/**
 * Lays out a `flexGroup`'s visible children: each comes back as a copy with
 * its position resolved and its main-axis size set. A child's own `position`
 * is kept as an offset from where flex puts it.
 */
export const layoutFlexChildren = (
  element: FlexGroupElementConfig,
  context: ElementFactoryContext,
): ElementConfig[] => {
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
    ? (element.size?.width ?? 0)
    : (element.size?.height ?? 0);
  const containerCrossSize = isRow
    ? (element.size?.height ?? 0)
    : (element.size?.width ?? 0);

  const visibleChildren = collectVisibleChildren(
    element.elements,
    direction,
    context,
  );

  if (visibleChildren.length === 0) return [];

  const lines = buildFlexLines(visibleChildren, containerMainSize, gap, wrap);
  const orderedLines = wrapDirection === "end" ? [...lines].reverse() : lines;

  const positionedChildren: ElementConfig[] = [];
  let crossPosition = 0;

  for (const line of orderedLines) {
    const rawSizes = applyFlexSizing(line, containerMainSize, gap);

    // Apply maxWidth/maxHeight constraints to sizes before calculating justify
    const sizes = rawSizes.map((size, i) => {
      const child = line[i];
      if (isRow && child.element.size?.maxWidth !== undefined) {
        return Math.min(size, child.element.size.maxWidth);
      } else if (!isRow && child.element.size?.maxHeight !== undefined) {
        return Math.min(size, child.element.size.maxHeight);
      }
      return size;
    });

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
      line.length,
    );

    let mainPosition = Math.max(0, offset);

    for (let i = 0; i < line.length; i++) {
      const child = line[i];
      const childMainSize = sizes[i];

      const alignOffset = calculateAlignOffset(
        align,
        alignmentCrossSize,
        child.crossSize,
      );

      const childOffsetX = child.element.position?.x ?? 0;
      const childOffsetY = child.element.position?.y ?? 0;

      positionedChildren.push({
        ...child.element,
        position: {
          x:
            (isRow ? mainPosition : crossPosition + alignOffset) + childOffsetX,
          y:
            (isRow ? crossPosition + alignOffset : mainPosition) + childOffsetY,
        },
        size: {
          ...child.element.size,
          ...(isRow ? { width: childMainSize } : { height: childMainSize }),
        },
      });

      mainPosition += childMainSize + (spaceBetween || gap);
    }

    crossPosition += maxCrossSize + gap;
  }

  return positionedChildren;
};
