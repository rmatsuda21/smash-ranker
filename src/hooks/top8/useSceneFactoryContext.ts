import { useMemo } from "react";

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
