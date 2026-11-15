import { memo, useMemo } from "react";

import { AssetLoadBoundary } from "@/components/top8/Canvas/AssetLoadBoundary";
import { ElementList } from "@/utils/top8/elementFactory";
import type { Design, ElementConfig } from "@/types/top8/Design";
import type { TournamentInfo } from "@/types/top8/Tournament";

import {
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

const NO_ELEMENTS: ElementConfig[] = [];

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

    const context = useMemo(
      () => ({
        ...factoryContext,
        fontFamily,
        tournament,
        containerSize: canvasSize,
        design,
        onElementSelect,
      }),
      [
        factoryContext,
        fontFamily,
        tournament,
        canvasSize,
        design,
        onElementSelect,
      ],
    );

    return (
      <AssetLoadBoundary onAllReady={onReady}>
        <ElementList elements={elements ?? NO_ELEMENTS} context={context} />
      </AssetLoadBoundary>
    );
  },
);
