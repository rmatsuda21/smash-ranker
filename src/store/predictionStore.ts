import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";

import type {
  PredictionCount,
  PredictionPhase,
  PredictionPlayer,
} from "@/types/predict/Prediction";

interface PredictionState {
  tournamentName: string;
  eventName: string;
  tournamentDate: string;
  tournamentUrl: string;
  tournamentIconUrl: string;

  entrantPool: PredictionPlayer[];
  predictions: PredictionPlayer[];

  predictionCount: PredictionCount;
  customCount: number;
  phase: PredictionPhase;
  fetching: boolean;
  error: string;
}

type PredictionAction =
  | { type: "FETCH_START" }
  | {
      type: "FETCH_SUCCESS";
      payload: {
        tournamentName: string;
        eventName: string;
        tournamentDate: string;
        tournamentUrl: string;
        tournamentIconUrl: string;
        entrants: PredictionPlayer[];
      };
    }
  | { type: "FETCH_FAIL"; payload: string }
  | { type: "ADD_PREDICTION"; payload: PredictionPlayer }
  | { type: "REMOVE_PREDICTION"; payload: string }
  | { type: "REORDER_PREDICTIONS"; fromIndex: number; toIndex: number }
  | { type: "SET_PREDICTION_COUNT"; payload: PredictionCount }
  | { type: "SET_CUSTOM_COUNT"; payload: number }
  | { type: "SET_PHASE"; payload: PredictionPhase }
  | { type: "AUTO_FILL" }
  | { type: "CLEAR_PREDICTIONS" }
  | { type: "RESET" };

const initialState: PredictionState = {
  tournamentName: "",
  eventName: "",
  tournamentDate: "",
  tournamentUrl: "",
  tournamentIconUrl: "",
  entrantPool: [],
  predictions: [],
  predictionCount: 8,
  customCount: 8,
  phase: "input",
  fetching: false,
  error: "",
};

const getEffectiveCount = (state: PredictionState): number => {
  return state.predictionCount === "custom"
    ? state.customCount
    : state.predictionCount;
};

const insertAtSeedPosition = (
  pool: PredictionPlayer[],
  player: PredictionPlayer,
): PredictionPlayer[] => {
  const newPool = [...pool];
  const insertIndex = newPool.findIndex((p) => p.seed > player.seed);
  if (insertIndex === -1) {
    newPool.push(player);
  } else {
    newPool.splice(insertIndex, 0, player);
  }
  return newPool;
};

const predictionReducer = (
  state: PredictionState,
  action: PredictionAction,
): Partial<PredictionState> => {
  switch (action.type) {
    case "FETCH_START":
      return { fetching: true, error: "" };

    case "FETCH_SUCCESS":
      return {
        fetching: false,
        error: "",
        tournamentName: action.payload.tournamentName,
        eventName: action.payload.eventName,
        tournamentDate: action.payload.tournamentDate,
        tournamentUrl: action.payload.tournamentUrl,
        tournamentIconUrl: action.payload.tournamentIconUrl,
        entrantPool: action.payload.entrants,
        predictions: [],
        phase: "input",
      };

    case "FETCH_FAIL":
      return { fetching: false, error: action.payload };

    case "ADD_PREDICTION": {
      const max = getEffectiveCount(state);
      if (state.predictions.length >= max) return {};
      return {
        entrantPool: state.entrantPool.filter(
          (p) => p.id !== action.payload.id,
        ),
        predictions: [...state.predictions, action.payload],
      };
    }

    case "REMOVE_PREDICTION": {
      const player = state.predictions.find((p) => p.id === action.payload);
      if (!player) return {};
      return {
        predictions: state.predictions.filter((p) => p.id !== action.payload),
        entrantPool: insertAtSeedPosition(state.entrantPool, player),
      };
    }

    case "REORDER_PREDICTIONS":
      return {
        predictions: arrayMove(
          state.predictions,
          action.fromIndex,
          action.toIndex,
        ),
      };

    case "SET_PREDICTION_COUNT": {
      const newCount =
        action.payload === "custom" ? state.customCount : action.payload;
      const currentCount = state.predictions.length;

      if (currentCount > newCount) {
        const removed = state.predictions.slice(newCount);
        let newPool = state.entrantPool;
        for (const player of removed) {
          newPool = insertAtSeedPosition(newPool, player);
        }
        return {
          predictionCount: action.payload,
          predictions: state.predictions.slice(0, newCount),
          entrantPool: newPool,
        };
      }
      return { predictionCount: action.payload };
    }

    case "SET_CUSTOM_COUNT": {
      const clamped = Math.max(1, Math.min(action.payload, 64));
      const currentCount = state.predictions.length;

      if (
        state.predictionCount === "custom" &&
        currentCount > clamped
      ) {
        const removed = state.predictions.slice(clamped);
        let newPool = state.entrantPool;
        for (const player of removed) {
          newPool = insertAtSeedPosition(newPool, player);
        }
        return {
          customCount: clamped,
          predictions: state.predictions.slice(0, clamped),
          entrantPool: newPool,
        };
      }
      return { customCount: clamped };
    }

    case "SET_PHASE":
      return { phase: action.payload };

    case "AUTO_FILL": {
      const max = getEffectiveCount(state);
      const slotsToFill = max - state.predictions.length;
      if (slotsToFill <= 0) return {};

      const toAdd = state.entrantPool.slice(0, slotsToFill);
      return {
        predictions: [...state.predictions, ...toAdd],
        entrantPool: state.entrantPool.slice(slotsToFill),
      };
    }

    case "CLEAR_PREDICTIONS": {
      let newPool = [...state.entrantPool];
      for (const player of state.predictions) {
        newPool = insertAtSeedPosition(newPool, player);
      }
      return { predictions: [], entrantPool: newPool };
    }

    case "RESET":
      return { ...initialState };

    default:
      return {};
  }
};

interface PredictionStore extends PredictionState {
  dispatch: (action: PredictionAction) => void;
}

export const usePredictionStore = create<PredictionStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        dispatch: (action: PredictionAction) =>
          set((state) => predictionReducer(state, action), false, action),
      }),
      {
        name: "prediction-store",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          tournamentName: state.tournamentName,
          eventName: state.eventName,
          tournamentDate: state.tournamentDate,
          tournamentUrl: state.tournamentUrl,
          tournamentIconUrl: state.tournamentIconUrl,
          entrantPool: state.entrantPool,
          predictions: state.predictions,
          predictionCount: state.predictionCount,
          customCount: state.customCount,
          phase: state.phase,
        }),
      },
    ),
  ),
);
