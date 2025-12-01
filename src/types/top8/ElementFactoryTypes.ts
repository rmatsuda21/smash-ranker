import { ReactNode } from "react";

import { ElementConfig, ElementType } from "@/types/top8/LayoutTypes";
import { PlayerInfo } from "@/types/top8/PlayerTypes";
import { TournamentInfo } from "@/types/top8/TournamentTypes";

export interface ElementFactoryContext {
  fontFamily?: string;
  player?: PlayerInfo;
  tournament?: TournamentInfo;
  containerSize?: { width: number; height: number };
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

export type ElementCreatorMap = {
  [K in ElementType]:
    | ElementCreator<Extract<ElementConfig, { type: K }>>
    | undefined;
};
