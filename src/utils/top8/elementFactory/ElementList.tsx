import { Group } from "react-konva";
import {
  cloneElement,
  isValidElement,
  memo,
  type ReactElement,
  type ReactNode,
} from "react";
import type { SceneContext } from "konva/lib/Context";

import type { ElementConfig } from "@/types/top8/Design";
import type {
  ElementCreator,
  ElementFactoryContext,
} from "@/types/top8/ElementFactory";
import { evaluateElementCondition } from "@/utils/top8/evaluateElementCondition";
import { SelectableElement } from "@/components/top8/Canvas/SelectableElement";
import { FilteredElement } from "@/components/top8/Canvas/FilteredElement";
import { perfMeasure } from "@/utils/top8/renderPerf";
import { elementCreators } from "./creators";
import { getElementKey } from "./elementKey";

const DEFAULT_CONTAINER_SIZE = { width: 100, height: 100 };

/** Overrides props on the node a creator returned. */
const withProps = (node: ReactNode, props: Record<string, unknown>) =>
  isValidElement(node)
    ? cloneElement(node as ReactElement<Record<string, unknown>>, props)
    : node;

const isContainer = (element: ElementConfig) =>
  element.type === "group" ||
  element.type === "flexGroup" ||
  element.type === "flexGrid";

/**
 * The clip path for an element with `clip` set.
 *
 * `clipPoints` clips to a polygon in the element's own coordinate space.
 * Elements with `clipCornerRadius` clip to their own bounds (e.g. rounded
 * character image groups). All other clips use the parent container's size
 * (e.g. kagaribi character overflow clipping).
 */
const getClip = (
  element: ElementConfig,
  containerSize: { width: number; height: number },
) => {
  const points = element.clipPoints;
  if (points && points.length >= 3) {
    const clipFunc = (ctx: SceneContext) => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
    };
    return { clipFunc, toSelf: true };
  }

  if (!element.clip) return undefined;

  const toSelf = Boolean(element.clipCornerRadius);
  const width = toSelf
    ? (element.size?.width ?? containerSize.width)
    : containerSize.width;
  const height = toSelf
    ? (element.size?.height ?? containerSize.height)
    : containerSize.height;
  const inset = element.clipOffset;
  const x = -(inset?.left ?? 0);
  const y = -(inset?.top ?? 0);
  const w = width + (inset?.left ?? 0) + (inset?.right ?? 0);
  const h = height + (inset?.top ?? 0) + (inset?.bottom ?? 0);

  const clipFunc = (ctx: SceneContext) => {
    ctx.beginPath();
    if (element.clipCornerRadius) {
      ctx.roundRect(x, y, w, h, element.clipCornerRadius);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.closePath();
  };

  return { clipFunc, toSelf };
};

/** Rotation, skew and scale for elements that set them. Selectable elements
 *  get theirs from `SelectableElement` instead. */
const getTransform = (element: ElementConfig) => {
  const { rotation, skew, scale } = element;
  const scaleX = scale?.x ?? 1;
  const scaleY = scale?.y ?? 1;
  if (!rotation && !skew?.x && !skew?.y && scaleX === 1 && scaleY === 1) {
    return undefined;
  }
  return {
    rotation: rotation ?? 0,
    skewX: skew?.x ?? 0,
    skewY: skew?.y ?? 0,
    scaleX,
    scaleY,
  };
};

/**
 * One element config → its Konva node, wrapped in whatever the config asks
 * for. From the outside in: selection, then filters and clipping, then the
 * node the element's creator returns.
 */
const renderElement = (
  element: ElementConfig,
  index: number,
  context: ElementFactoryContext,
): ReactNode => {
  if (!(element.type in elementCreators)) return null;
  if (element.hidden) return null;
  if (!evaluateElementCondition(element.conditions, context)) return null;

  const creator = elementCreators[element.type] as ElementCreator<
    typeof element
  >;
  const node = creator({ element, index, context });
  if (!node) return null;

  const key = getElementKey(element, index);
  const clip = getClip(
    element,
    context.containerSize ?? DEFAULT_CONTAINER_SIZE,
  );
  const filters = element.filterEffects?.length
    ? element.filterEffects
    : undefined;

  if (element.selectable && !context.options?.disableSelectable) {
    // The wrapper takes over the element's position and hit-testing.
    const inner = withProps(node, { x: 0, y: 0, listening: false });

    return (
      <SelectableElement
        key={key}
        x={element.position.x}
        y={element.position.y}
        draggable={false}
        onClick={() => context.onElementSelect?.()}
        width={element.size?.width}
        height={element.size?.height}
        scaleX={element.scale?.x}
        scaleY={element.scale?.y}
        rotation={element.rotation ?? 0}
        clipFunc={clip?.clipFunc}
        listening={true}
        name={element.name ?? `element-${index}`}
      >
        {filters ? (
          <FilteredElement filtersConfig={filters}>{inner}</FilteredElement>
        ) : (
          inner
        )}
      </SelectableElement>
    );
  }

  const listening = isContainer(element);
  const transform = getTransform(element);

  if (!filters && !clip && !transform) {
    return withProps(node, { key, listening });
  }

  // A clip to the element's own bounds is drawn in the element's coordinate
  // space, and a rotation, skew or scale pivots on its position. Either way the
  // wrapper takes over the position.
  const wrapperOwnsPosition = (clip?.toSelf ?? false) || Boolean(transform);
  const inner = withProps(node, {
    listening,
    ...(wrapperOwnsPosition && { x: 0, y: 0 }),
  });
  const wrapperProps = {
    x: wrapperOwnsPosition ? element.position.x : undefined,
    y: wrapperOwnsPosition ? element.position.y : undefined,
    ...transform,
    clipFunc: clip?.clipFunc,
    listening,
    draggable: context.options?.editable ?? false,
  };

  return filters ? (
    <FilteredElement key={key} {...wrapperProps} filtersConfig={filters}>
      {inner}
    </FilteredElement>
  ) : (
    <Group key={key} {...wrapperProps}>
      {inner}
    </Group>
  );
};

type Props = {
  elements: ElementConfig[];
  context: ElementFactoryContext;
};

/**
 * Renders a list of element configs as Konva nodes, in order. This is the
 * only way element configs become nodes: scene content renders it at the top
 * level and container elements (group, flexGroup, flexGrid) render it for
 * their children.
 *
 * Pass the parent's whole children array in one list: the index within the
 * list is the fallback React key for elements without an `id`.
 */
export const ElementList = memo(({ elements, context }: Props) =>
  perfMeasure("renderElements", () =>
    elements.map((element, index) => renderElement(element, index, context)),
  ),
);
