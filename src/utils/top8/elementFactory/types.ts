import type { ElementFactoryContext } from "@/types/top8/ElementFactory";

export interface CreateKonvaElementsOptions {
  onAllReady?: () => void;
  onError?: (error: Error) => void;
  perfectDraw?: boolean;
}

export interface AsyncLoadTracker {
  expected: number;
  loaded: number;
  hasErrored: boolean;
  onAllReady?: () => void;
  onError?: (error: Error) => void;
}

export type InternalContext = ElementFactoryContext & {
  _asyncTracker?: AsyncLoadTracker;
};
