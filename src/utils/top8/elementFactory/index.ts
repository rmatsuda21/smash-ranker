import type { ReactNode } from "react";

import type { ElementConfig } from "@/types/top8/Design";
import type { ElementFactoryContext } from "@/types/top8/ElementFactory";
import type {
  CreateKonvaElementsOptions,
  AsyncLoadTracker,
  InternalContext,
} from "./types";
import { countAsyncElements } from "./asyncTracking";
import { createKonvaElementsInternal } from "./createElements";

export type { CreateKonvaElementsOptions };

export const createKonvaElements = (
  elements: ElementConfig[],
  context: ElementFactoryContext = {},
  options?: CreateKonvaElementsOptions
): ReactNode[] => {
  if (!options?.onAllReady && !options?.onError) {
    return createKonvaElementsInternal(elements, context);
  }

  const expectedCount = countAsyncElements(elements, context);

  if (expectedCount === 0) {
    if (typeof options.onAllReady === "function") {
      queueMicrotask(options.onAllReady);
    }
    return createKonvaElementsInternal(elements, context);
  }

  const tracker: AsyncLoadTracker = {
    expected: expectedCount,
    loaded: 0,
    hasErrored: false,
    onAllReady: options.onAllReady,
    onError: options.onError,
  };

  const internalContext: InternalContext = {
    ...context,
    _asyncTracker: tracker,
  };

  return createKonvaElementsInternal(elements, internalContext);
};

