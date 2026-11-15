import { useMemo, useRef } from "react";

import { useRenderProfile } from "@/components/top8/Canvas/RenderProfileContext";
import type { ElementFactoryContext } from "@/types/top8/ElementFactory";

/** Colors, texts and background image settings every scene part resolves
 *  its elements against. */
export type SceneDesign = NonNullable<ElementFactoryContext["design"]>;

const READ_ONLY_OPTIONS = { editable: false, disableSelectable: true };

/**
 * The element-factory settings that follow from the stage's render profile
 * rather than from the design: read-only stages skip the selection wrappers,
 * and offscreen stages skip Konva's perfect-draw buffering.
 */
export const useSceneFactoryContext = (): Pick<
  ElementFactoryContext,
  "options" | "perfectDraw"
> => {
  const { interactive, perfectDraw } = useRenderProfile();

  return useMemo(
    () => ({
      options: interactive ? undefined : READ_ONLY_OPTIONS,
      perfectDraw: perfectDraw ? undefined : false,
    }),
    [interactive, perfectDraw],
  );
};

/** A function with a stable identity that always calls the latest `fn`.
 *  Lets ready callbacks sit outside `useMemo` dependency lists. */
export const useLatestCallback = <Args extends unknown[]>(
  fn: ((...args: Args) => void) | undefined,
): ((...args: Args) => void) => {
  const ref = useRef(fn);
  ref.current = fn;
  return useMemo(
    () =>
      (...args: Args) =>
        ref.current?.(...args),
    [],
  );
};
