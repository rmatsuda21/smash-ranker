import { cloneElement, isValidElement, ReactElement, ReactNode } from "react";
import { Group } from "react-konva";

import type {
  ElementConfig,
  GroupElementConfig,
  FlexGroupElementConfig,
} from "@/types/top8/Design";
import type { ElementFactoryContext } from "@/types/top8/ElementFactory";
import { CustomImage } from "@/components/top8/Canvas/CustomImage";
import { CustomSVG } from "@/components/top8/Canvas/CustomSVG";
import { evaluateElementCondition } from "@/utils/top8/evaluateElementCondition";
import { ASYNC_ELEMENT_TYPES } from "./constants";
import type { AsyncLoadTracker } from "./types";
import { elementCreators } from "./creators";

export const countAsyncElements = (
  elements: ElementConfig[],
  context: ElementFactoryContext
): number => {
  let count = 0;

  for (const element of elements) {
    if (!(element.type in elementCreators)) continue;

    const shouldRender =
      !element.hidden && evaluateElementCondition(element.conditions, context);

    if (!shouldRender) continue;

    if (element.type === "group") {
      count += countAsyncElements(
        (element as GroupElementConfig).elements,
        context
      );
    } else if (element.type === "flexGroup") {
      count += countAsyncElements(
        (element as FlexGroupElementConfig).elements,
        context
      );
    } else if (element.type === "altCharacterImage") {
      const player = context.player;
      if (player && player.characters.length > 1) {
        count += player.characters.length - 1;
      }
    } else if (element.type === "characterImage") {
      const player = context.player;
      if (player && player.characters.length > 0) {
        count += 1;
      }
    } else if (element.type === "tournamentIcon") {
      if (context.tournament?.iconSrc) {
        count += 1;
      }
    } else if (element.type === "backgroundImage") {
      if (context.design?.bgAssetId) {
        count += 1;
      }
    } else if (element.type === "playerFlag") {
      if (context.player?.country) {
        count += 1;
      }
    } else if (ASYNC_ELEMENT_TYPES.has(element.type)) {
      count += 1;
    }
  }

  return count;
};

export const injectAsyncCallbacks = (
  node: ReactNode,
  tracker: AsyncLoadTracker
): ReactNode => {
  if (!isValidElement(node)) return node;

  const handleReady = () => {
    tracker.loaded += 1;
    if (tracker.loaded === tracker.expected && !tracker.hasErrored) {
      tracker.onAllReady?.();
    }
  };

  const handleError = (error: Error) => {
    if (!tracker.hasErrored) {
      tracker.hasErrored = true;
      tracker.onError?.(error);
    }
  };

  const elementType = node.type;
  if (elementType === CustomImage || elementType === CustomSVG) {
    return cloneElement(
      node as ReactElement<{
        onReady?: () => void;
        onError?: (e: Error) => void;
      }>,
      {
        onReady: handleReady,
        onError: handleError,
      }
    );
  }

  if (elementType === Group) {
    const groupElement = node as ReactElement<{ children?: ReactNode }>;
    const children = groupElement.props.children;

    if (children) {
      const processedChildren = Array.isArray(children)
        ? children.map((child) => injectAsyncCallbacks(child, tracker))
        : injectAsyncCallbacks(children, tracker);

      return cloneElement(groupElement, { children: processedChildren });
    }
  }

  return node;
};
