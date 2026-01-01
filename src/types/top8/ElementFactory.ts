import { CanvasConfig, ElementConfig } from "@/types/top8/Design";
import { PlayerInfo } from "@/types/top8/Player";
import { TournamentInfo } from "@/types/top8/Tournament";

export interface ElementFactoryContext {
  fontFamily?: string;
  player?: PlayerInfo;
  tournament?: TournamentInfo;
  canvas?: CanvasConfig;
  containerSize?: { width: number; height: number };
  onElementSelect?: () => void;
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
}) => React.ReactNode;
