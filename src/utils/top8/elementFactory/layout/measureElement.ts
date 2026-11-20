/**
 * Intrinsic sizes of elements along a flex container's axes, before any
 * growing or shrinking.
 */
import type {
  CustomAltCharacterImageElementConfig,
  ElementConfig,
  FlexGroupElementConfig,
  SmartTextElementConfig,
  TextElementConfig,
} from "@/types/top8/Design";
import type { ElementFactoryContext } from "@/types/top8/ElementFactory";
import { composeFontStyle } from "@/utils/fonts/fontLoader";
import { evaluateElementCondition } from "@/utils/top8/evaluateElementCondition";
import { resolveElementText } from "@/utils/top8/resolveElementText";
import {
  fitWrappedFontSize,
  measureTextBoxHeight,
  measureTextBoxWidth,
} from "@/utils/top8/textMetrics";

import { findOptimalSquareGrid } from "./gridLayout";

/** Font size a wrapping `text` renders at: its own, or smaller when it has
 *  a `maxHeight` its wrapped lines would otherwise exceed. */
export const getWrappedTextFontSize = (
  element: TextElementConfig,
  context: ElementFactoryContext,
): number => {
  const fontSize = element.fontSize ?? 20;
  if (element.maxHeight === undefined || element.size?.width === undefined) {
    return fontSize;
  }

  const fontFamily = context.fontFamily ?? "Arial";

  return fitWrappedFontSize({
    text: resolveElementText(element, context),
    fontSize,
    fontFamily,
    fontStyle: composeFontStyle(
      fontFamily,
      element.fontWeight,
      element.fontStyle,
    ),
    width: element.size.width,
    maxHeight: element.maxHeight,
  });
};

/** Size along the main axis: `flex.basis` when set, otherwise measured from
 *  the element's content or taken from its configured size. */
export const getElementMainSize = (
  element: ElementConfig,
  direction: "row" | "column",
  context: ElementFactoryContext,
): number => {
  const basis = element.flex?.basis;
  if (basis !== undefined) return basis;

  if (direction === "row") {
    if (element.type === "smartText" || element.type === "text") {
      const textEl = element as TextElementConfig | SmartTextElementConfig;
      const text = resolveElementText(textEl, context);

      const fontFamily = context.fontFamily ?? "Arial";

      return measureTextBoxWidth({
        text,
        fontSize: textEl.fontSize ?? 20,
        fontFamily,
        fontStyle: composeFontStyle(
          fontFamily,
          textEl.fontWeight,
          textEl.fontStyle,
        ),
        width: textEl.size?.width,
        letterSpacing: textEl.letterSpacing,
      });
    }

    if (element.type === "customAltCharacterImage") {
      const altEl = element as CustomAltCharacterImageElementConfig;
      const player = context.player;

      if (!player) return 0;

      const totalItems = altEl.includeMainCharacter
        ? player.characters.length
        : player.characters.length - 1;
      const numItems =
        altEl.characterIndex === undefined
          ? totalItems
          : Math.min(1, totalItems - altEl.characterIndex);

      if (numItems <= 0) return 0;

      const columnGap = altEl.gap ?? 5;
      const rowGap = altEl.rowGap ?? altEl.gap ?? 5;
      const preferredCellSize = altEl.elementTemplate?.size?.width ?? 70;
      const fixedColumns = altEl.columns;

      if (fixedColumns) {
        const cols = Math.min(fixedColumns, numItems);
        const actualContentWidth =
          cols * preferredCellSize + (cols - 1) * columnGap;
        return actualContentWidth;
      }

      const maxWidth =
        altEl.size?.maxWidth ??
        altEl.size?.width ??
        preferredCellSize * numItems;
      const maxHeight = altEl.size?.height ?? preferredCellSize;

      const grid = findOptimalSquareGrid(
        numItems,
        maxWidth,
        maxHeight,
        columnGap,
        rowGap,
      );

      const cellSize = Math.min(grid.cellSize, preferredCellSize);
      const actualContentWidth =
        grid.columns * cellSize + (grid.columns - 1) * columnGap;

      return actualContentWidth;
    }

    if (
      element.type === "flexGroup" &&
      element.size?.maxWidth !== undefined &&
      element.size?.width === undefined
    ) {
      const flexEl = element as FlexGroupElementConfig;
      const flexDirection = flexEl.direction ?? "row";
      const gap = flexEl.gap ?? 0;

      if (flexDirection === "row" && flexEl.elements) {
        let contentWidth = 0;
        const visibleElements = flexEl.elements.filter(
          (child) =>
            !child.hidden &&
            evaluateElementCondition(child.conditions, context),
        );

        for (let i = 0; i < visibleElements.length; i++) {
          contentWidth += getElementMainSize(
            visibleElements[i],
            "row",
            context,
          );
          if (i < visibleElements.length - 1) {
            contentWidth += gap;
          }
        }

        return Math.min(contentWidth, element.size.maxWidth);
      }

      // A column is as wide as its widest child.
      if (flexDirection === "column" && flexEl.elements) {
        const widest = flexEl.elements.reduce(
          (max, child) =>
            child.hidden || !evaluateElementCondition(child.conditions, context)
              ? max
              : Math.max(max, getElementMainSize(child, "row", context)),
          0,
        );

        return Math.min(widest, element.size.maxWidth);
      }
    }

    return element.size?.width ?? 0;
  }

  if (element.size?.height === undefined) {
    // Wrapping text with a fixed width is as tall as its wrapped lines.
    if (element.type === "text" && element.size?.width !== undefined) {
      const fontFamily = context.fontFamily ?? "Arial";

      return measureTextBoxHeight({
        text: resolveElementText(element, context),
        fontSize: getWrappedTextFontSize(element, context),
        fontFamily,
        fontStyle: composeFontStyle(
          fontFamily,
          element.fontWeight,
          element.fontStyle,
        ),
        width: element.size.width,
      });
    }

    if (element.type === "text" || element.type === "smartText") {
      const textEl = element as TextElementConfig | SmartTextElementConfig;
      return textEl.fontSize ?? 20;
    }

    // A group with no height of its own is as tall as its content.
    if (element.type === "group") {
      const bottom = (element.elements ?? []).reduce(
        (max, child) =>
          child.hidden || !evaluateElementCondition(child.conditions, context)
            ? max
            : Math.max(
                max,
                child.position.y + getElementMainSize(child, "column", context),
              ),
        0,
      );

      return bottom * (element.scale?.y ?? 1);
    }
  }

  return element.size?.height ?? 0;
};

/** Size across the main axis. */
export const getElementCrossSize = (
  element: ElementConfig,
  direction: "row" | "column",
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
