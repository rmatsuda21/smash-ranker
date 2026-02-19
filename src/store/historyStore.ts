import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type HistoryActionType =
  | "SET_BACKGROUND_IMG"
  | "CLEAR_BACKGROUND_IMG"
  | "SET_BACKGROUND_IMAGE_DARKNESS"
  | "UPDATE_COLOR_PALETTE"
  | "SET_FONT";

export interface HistoryEntry {
  type: HistoryActionType;
  timestamp: number;
  undoData: unknown;
  redoData: unknown;
}

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxHistorySize: number;
}

interface HistoryActions {
  pushAction: (entry: Omit<HistoryEntry, "timestamp">) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

type HistoryStore = HistoryState & HistoryActions;

const MAX_HISTORY_SIZE = 50;

const initialState: HistoryState = {
  past: [],
  future: [],
  maxHistorySize: MAX_HISTORY_SIZE,
};

export const useHistoryStore = create<HistoryStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      pushAction: (entry) => {
        const { past, maxHistorySize } = get();

        const newEntry: HistoryEntry = {
          ...entry,
          timestamp: Date.now(),
        };

        const newPast = [...past, newEntry];

        if (newPast.length > maxHistorySize) {
          newPast.shift();
        }

        set({
          past: newPast,
          future: [],
        });
      },

      undo: () => {
        const { past, future } = get();

        if (past.length === 0) return null;

        const lastEntry = past[past.length - 1];
        const newPast = past.slice(0, -1);

        set({
          past: newPast,
          future: [...future, lastEntry],
        });

        return lastEntry;
      },

      redo: () => {
        const { past, future } = get();

        if (future.length === 0) return null;

        const nextEntry = future[future.length - 1];
        const newFuture = future.slice(0, -1);

        set({
          past: [...past, nextEntry],
          future: newFuture,
        });

        return nextEntry;
      },

      canUndo: () => {
        const { past } = get();
        return past.length > 0;
      },

      canRedo: () => {
        const { future } = get();
        return future.length > 0;
      },

      clearHistory: () => {
        set({
          past: [],
          future: [],
        });
      },
    }),
    { name: "HistoryStore" }
  )
);
