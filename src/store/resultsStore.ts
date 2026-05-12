import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

import type { ResultsEntrantSummary } from "@/types/results/ResultsEntrantSummary";
import type { PlayerTournamentResults } from "@/types/results/PlayerTournamentResults";
import {
  DEFAULT_PREDICTION_PALETTE,
  type PredictionPalette,
} from "@/types/predict/PredictionPalette";

interface ResultsState {
  tournamentName: string;
  eventName: string;
  tournamentDate: string;
  tournamentUrl: string;
  tournamentIconUrl: string;
  tournamentCountry: string | null;
  numEntrants: number;
  videogameId: string | null;
  colorPalette: PredictionPalette;

  entrantPool: ResultsEntrantSummary[];

  selectedEntrantId: string | null;
  playerResults: PlayerTournamentResults | null;
  // Most-played character per entrant, keyed by entrant id. Populated lazily
  // for the selected player and each unique opponent. null = fetched but the
  // player has no recorded character usage.
  fallbackCharacters: Record<string, string | null>;

  fetchingPool: boolean;
  fetchingResults: boolean;
  error: string;
}

type ResultsAction =
  | { type: "FETCH_POOL_START" }
  | {
      type: "FETCH_POOL_SUCCESS";
      payload: {
        tournamentName: string;
        eventName: string;
        tournamentDate: string;
        tournamentUrl: string;
        tournamentIconUrl: string;
        tournamentCountry: string | undefined;
        numEntrants: number;
        videogameId: string | null;
        entrants: ResultsEntrantSummary[];
      };
    }
  | { type: "FETCH_POOL_FAIL"; payload: string }
  | { type: "SET_COLOR_PALETTE"; payload: PredictionPalette }
  | { type: "SELECT_ENTRANT"; payload: string }
  | { type: "FETCH_RESULTS_START" }
  | { type: "FETCH_RESULTS_SUCCESS"; payload: PlayerTournamentResults }
  | { type: "FETCH_RESULTS_FAIL"; payload: string }
  | {
      type: "FETCH_FALLBACK_SUCCESS";
      payload: { entrantId: string; characterId: string | null };
    }
  | { type: "CLEAR_SELECTION" }
  | { type: "RESET" };

const initialState: ResultsState = {
  tournamentName: "",
  eventName: "",
  tournamentDate: "",
  tournamentUrl: "",
  tournamentIconUrl: "",
  tournamentCountry: null,
  numEntrants: 0,
  videogameId: null,
  colorPalette: DEFAULT_PREDICTION_PALETTE,
  entrantPool: [],
  selectedEntrantId: null,
  playerResults: null,
  fallbackCharacters: {},
  fetchingPool: false,
  fetchingResults: false,
  error: "",
};

const resultsReducer = (
  state: ResultsState,
  action: ResultsAction,
): Partial<ResultsState> => {
  switch (action.type) {
    case "FETCH_POOL_START":
      return {
        fetchingPool: true,
        error: "",
        selectedEntrantId: null,
        playerResults: null,
        fallbackCharacters: {},
      };

    case "FETCH_POOL_SUCCESS":
      return {
        fetchingPool: false,
        error: "",
        tournamentName: action.payload.tournamentName,
        eventName: action.payload.eventName,
        tournamentDate: action.payload.tournamentDate,
        tournamentUrl: action.payload.tournamentUrl,
        tournamentIconUrl: action.payload.tournamentIconUrl,
        tournamentCountry: action.payload.tournamentCountry ?? null,
        numEntrants: action.payload.numEntrants,
        videogameId: action.payload.videogameId,
        colorPalette: DEFAULT_PREDICTION_PALETTE,
        entrantPool: action.payload.entrants,
        selectedEntrantId: null,
        playerResults: null,
        fallbackCharacters: {},
      };

    case "FETCH_POOL_FAIL":
      return { fetchingPool: false, error: action.payload };

    case "SET_COLOR_PALETTE":
      return { colorPalette: action.payload };

    case "SELECT_ENTRANT":
      if (state.selectedEntrantId === action.payload) return {};
      return {
        selectedEntrantId: action.payload,
        playerResults: null,
        fallbackCharacters: {},
      };

    case "FETCH_RESULTS_START":
      return { fetchingResults: true, error: "" };

    case "FETCH_RESULTS_SUCCESS":
      return {
        fetchingResults: false,
        error: "",
        playerResults: action.payload,
      };

    case "FETCH_RESULTS_FAIL":
      return { fetchingResults: false, error: action.payload };

    case "FETCH_FALLBACK_SUCCESS":
      return {
        fallbackCharacters: {
          ...state.fallbackCharacters,
          [action.payload.entrantId]: action.payload.characterId,
        },
      };

    case "CLEAR_SELECTION":
      return {
        selectedEntrantId: null,
        playerResults: null,
        fallbackCharacters: {},
      };

    case "RESET":
      return { ...initialState };

    default:
      return {};
  }
};

interface ResultsStore extends ResultsState {
  dispatch: (action: ResultsAction) => void;
}

export const useResultsStore = create<ResultsStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        dispatch: (action: ResultsAction) =>
          set((state) => resultsReducer(state, action), false, action),
      }),
      {
        name: "results-store",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          tournamentName: state.tournamentName,
          eventName: state.eventName,
          tournamentDate: state.tournamentDate,
          tournamentUrl: state.tournamentUrl,
          tournamentIconUrl: state.tournamentIconUrl,
          tournamentCountry: state.tournamentCountry,
          numEntrants: state.numEntrants,
          videogameId: state.videogameId,
          colorPalette: state.colorPalette,
          entrantPool: state.entrantPool,
          selectedEntrantId: state.selectedEntrantId,
          playerResults: state.playerResults,
          fallbackCharacters: state.fallbackCharacters,
        }),
      },
    ),
  ),
);
