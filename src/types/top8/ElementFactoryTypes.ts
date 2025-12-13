import { ReactNode } from "react";

import { ElementConfig } from "@/types/top8/LayoutTypes";
import { PlayerInfo } from "@/types/top8/PlayerTypes";
import { TournamentInfo } from "@/types/top8/TournamentTypes";
import { ColorPalette } from "@/utils/top8/resolveColor";

export interface ElementFactoryContext {
  fontFamily?: string;
  player?: PlayerInfo;
  tournament?: TournamentInfo;
  containerSize?: { width: number; height: number };
  colorPalette?: ColorPalette;
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
