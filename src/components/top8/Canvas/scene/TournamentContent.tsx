import { memo, useMemo } from "react";

import { createKonvaElements } from "@/utils/top8/elementFactory";
import type { Design, ElementConfig } from "@/types/top8/Design";
import type { TournamentInfo } from "@/types/top8/Tournament";

import {
  useLatestCallback,
  useSceneFactoryContext,
  type SceneDesign,
} from "./useSceneFactoryContext";

type Props = {
  elements: ElementConfig[] | undefined;
  canvasSize: Design["canvasSize"];
  design: SceneDesign;
  fontFamily: string;
  tournament: TournamentInfo;
  onElementSelect?: () => void;
  onReady?: () => void;
};

/** The design's tournament elements (title, date, entrants, ...). Renders
 *  bare nodes; the caller decides which layer or group they live in. */
export const TournamentContent = memo(
  ({
    elements,
    canvasSize,
    design,
    fontFamily,
    tournament,
    onElementSelect,
    onReady,
  }: Props) => {
    const factoryContext = useSceneFactoryContext();
    const handleReady = useLatestCallback(onReady);

    return useMemo(
      () =>
        createKonvaElements(
          elements ?? [],
          {
            ...factoryContext,
            fontFamily,
            tournament,
            containerSize: canvasSize,
            design,
            onElementSelect,
          },
          { onAllReady: handleReady },
        ),
      [
        elements,
        factoryContext,
        fontFamily,
        tournament,
        canvasSize,
        design,
        onElementSelect,
        handleReady,
      ],
    );
  },
);
