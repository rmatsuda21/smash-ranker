import { Group } from "react-konva";
import { cloneElement, isValidElement, ReactElement, ReactNode } from "react";
import { SceneContext } from "konva/lib/Context";

import type { ElementConfig } from "@/types/top8/Design";
import type { ElementCreator } from "@/types/top8/ElementFactory";
import { evaluateElementCondition } from "@/utils/top8/evaluateElementCondition";
import { SelectableElement } from "@/components/top8/Canvas/SelectableElement";
import { FilteredElement } from "@/components/top8/Canvas/FilteredElement";
import type { InternalContext } from "./types";
import { elementCreators } from "./creators";
import { setCreateKonvaElementsInternal } from "./creators/layout";
import { injectAsyncCallbacks } from "./asyncTracking";

export const createKonvaElementsInternal = (
  elements: ElementConfig[],
  context: InternalContext
): ReactNode[] => {
  const result: ReactNode[] = [];
  const containerSize = context.containerSize ?? { width: 100, height: 100 };
  const disableSelectable = context.options?.disableSelectable;
  const isEditable = context.options?.editable ?? false;

  for (let index = 0; index < elements.length; index++) {
    const element = elements[index];

    if (!(element.type in elementCreators)) {
      continue;
    }

    if (
      element.hidden ||
      !evaluateElementCondition(element.conditions, context)
    ) {
      continue;
    }

    const creator = elementCreators[element.type] as ElementCreator<
      typeof element
    >;
    let createdEl = creator({ element, index, context });

    if (!createdEl) {
      continue;
    }

    if (context._asyncTracker) {
      createdEl = injectAsyncCallbacks(createdEl, context._asyncTracker);
    }

    const clipFunc = element.clip
      ? (ctx: SceneContext) => {
          ctx.beginPath();
          ctx.rect(0, 0, containerSize.width, containerSize.height);
          ctx.closePath();
        }
      : undefined;

    const hasFilters =
      element.filterEffects && element.filterEffects.length > 0;

    if (element.selectable && !disableSelectable) {
      const resetEl = isValidElement(createdEl)
        ? cloneElement(
            createdEl as ReactElement<{
              x?: number;
              y?: number;
              listening?: boolean;
            }>,
            { x: 0, y: 0, listening: false }
          )
        : createdEl;

      const childContent = hasFilters ? (
        <FilteredElement filtersConfig={element.filterEffects}>
          {resetEl}
        </FilteredElement>
      ) : (
        resetEl
      );

      result.push(
        <SelectableElement
          key={element.id ?? `selectable-${index}`}
          x={element.position.x}
          y={element.position.y}
          draggable={false}
          onClick={() => context.onElementSelect?.()}
          width={element.size?.width}
          height={element.size?.height}
          scaleX={element.scale?.x}
          scaleY={element.scale?.y}
          rotation={element.rotation ?? 0}
          clipFunc={clipFunc}
          listening={true}
          name={element.name ?? `element-${index}`}
        >
          {childContent}
        </SelectableElement>
      );
    } else {
      const isContainer =
        element.type === "group" || element.type === "flexGroup";

      if (hasFilters) {
        const el = isValidElement(createdEl)
          ? cloneElement(createdEl as ReactElement<{ listening?: boolean }>, {
              listening: isContainer,
            })
          : createdEl;

        result.push(
          <FilteredElement
            draggable={isEditable}
            key={element.id ?? `filtered-${index}`}
            clipFunc={clipFunc}
            listening={isContainer}
            filtersConfig={element.filterEffects}
          >
            {el}
          </FilteredElement>
        );
      } else {
        const el = isValidElement(createdEl)
          ? cloneElement(createdEl as ReactElement<{ listening?: boolean }>, {
              listening: isContainer,
            })
          : createdEl;

        if (clipFunc) {
          result.push(
            <Group
              key={element.id ?? `group-${index}`}
              clipFunc={clipFunc}
              listening={isContainer}
              draggable={isEditable}
            >
              {el}
            </Group>
          );
        } else {
          result.push(el);
        }
      }
    }
  }

  return result;
};

setCreateKonvaElementsInternal(createKonvaElementsInternal);
