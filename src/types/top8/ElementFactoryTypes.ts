import { ReactNode } from "react";

import { CanvasConfig, ElementConfig } from "@/types/top8/LayoutTypes";
import { PlayerInfo } from "@/types/top8/PlayerTypes";
import { TournamentInfo } from "@/types/top8/TournamentTypes";

export interface ElementFactoryContext {
  fontFamily?: string;
  player?: PlayerInfo;
  tournament?: TournamentInfo;
  canvas?: CanvasConfig;
  containerSize?: { width: number; height: number };
  options?: {
    editable?: boolean;
  };
}

export type ElementCreator<T extends ElementConfig = ElementConfig> = ({
  element,
  index,
  context,
}: {
  element: T;
  index: number;
  context: ElementFactoryContext;
}) => ReactNode;
