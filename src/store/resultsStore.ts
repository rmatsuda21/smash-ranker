import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

import type { ResultsEntrantSummary } from "@/types/results/ResultsEntrantSummary";
import type { PlayerTournamentResults } from "@/types/results/PlayerTournamentResults";
import {
  DEFAULT_PREDICTION_PALETTE,
  type PredictionPalette,
} from "@/types/predict/PredictionPalette";
import {
  DEFAULT_SET_LIST_LAYOUT,
  DEFAULT_SET_LIST_STYLE,
  type SetListLayout,
  type SetListStyle,
} from "@/types/results/SetListDisplay";
import { safeLocalStorage } from "@/utils/safeStorage";

interface ResultsState {
  tournamentName: string;
  eventName: string;
  tournamentDate: string;
  tournamentUrl: string;
  tournamentIconUrl: string;
  tournamentId: string;
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

  // Set-list display preferences. Survive RESET — they're about the user,
  // not the loaded tournament.
  setListLayout: SetListLayout;
  setListStyle: SetListStyle;
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
        tournamentId: string;
        tournamentCountry: string | undefined;
        numEntrants: number;
        videogameId: string | null;
        entrants: ResultsEntrantSummary[];
      };
    }
  | {
      // A player picked before the pool is in (a recap link): their results
      // need only the event's game, so they load alongside the entrants. The
      // URL comes with it because it tells the results fetch which platform
      // the player is on.
      type: "PRESELECT_ENTRANT";
      payload: {
        entrantId: string;
        videogameId: string | null;
        tournamentUrl: string;
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
  | { type: "SET_LIST_LAYOUT"; payload: SetListLayout }
  | { type: "SET_LIST_STYLE"; payload: SetListStyle }
  | { type: "RESET" };

const initialState: ResultsState = {
  tournamentName: "",
  eventName: "",
  tournamentDate: "",
  tournamentUrl: "",
  tournamentIconUrl: "",
  tournamentId: "",
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
  setListLayout: DEFAULT_SET_LIST_LAYOUT,
  setListStyle: DEFAULT_SET_LIST_STYLE,
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
        tournamentId: action.payload.tournamentId,
        tournamentCountry: action.payload.tournamentCountry ?? null,
        numEntrants: action.payload.numEntrants,
        videogameId: action.payload.videogameId,
        colorPalette: DEFAULT_PREDICTION_PALETTE,
        entrantPool: action.payload.entrants,
        // FETCH_POOL_START cleared the selection, so one that exists now was
        // preselected for this pool: keep it if the player is in it.
        ...(state.selectedEntrantId &&
        action.payload.entrants.some(
          (entrant) => entrant.id === state.selectedEntrantId,
        )
          ? {}
          : {
              selectedEntrantId: null,
              playerResults: null,
              fallbackCharacters: {},
            }),
      };

    case "PRESELECT_ENTRANT":
      return {
        videogameId: action.payload.videogameId,
        tournamentUrl: action.payload.tournamentUrl,
        selectedEntrantId: action.payload.entrantId,
        playerResults: null,
        fallbackCharacters: {},
      };

    case "FETCH_POOL_FAIL":
      return {
        fetchingPool: false,
        error: action.payload,
        selectedEntrantId: null,
        playerResults: null,
        fallbackCharacters: {},
      };

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

    case "SET_LIST_LAYOUT":
      return { setListLayout: action.payload };

    case "SET_LIST_STYLE":
      return { setListStyle: action.payload };

    case "RESET":
      return {
        ...initialState,
        setListLayout: state.setListLayout,
        setListStyle: state.setListStyle,
      };

    default:
      return {};
  }
};

interface ResultsStore extends ResultsState {
  dispatch: (action: ResultsAction) => void;
}

// Bump on backwards-incompatible state shape changes. The `migrate` below
// folds any older shape into the current `initialState`, filling missing
// fields with defaults. Without this, an older persisted shape can crash
// render code that destructures fields that didn't exist yet (we hit this
// exact bug when `rankings` was first added to PlayerTournamentResults).
const RESULTS_STORE_VERSION = 2;

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
        version: RESULTS_STORE_VERSION,
        storage: createJSONStorage(() => safeLocalStorage),
        // Forward-compatible merge: persisted fields override defaults,
        // but any missing field falls back to whatever `initialState`
        // provides today. Returns the merged shape; zustand-persist
        // hydrates from it on next render.
        migrate: (persistedState, version) => {
          const merged: ResultsState = {
            ...initialState,
            ...(typeof persistedState === "object" && persistedState !== null
              ? (persistedState as Partial<ResultsState>)
              : {}),
          };
          // Defensive resets — values that should never be persisted as
          // "true" (loaded from a stopped fetch from a previous session).
          merged.fetchingPool = false;
          merged.fetchingResults = false;
          merged.error = "";
          // Before version 2 a fallback character could come from another
          // game than the event's; drop them so they are looked up again.
          if (version < 2) merged.fallbackCharacters = {};
          return merged;
        },
        partialize: (state) => ({
          tournamentName: state.tournamentName,
          eventName: state.eventName,
          tournamentDate: state.tournamentDate,
          tournamentUrl: state.tournamentUrl,
          tournamentIconUrl: state.tournamentIconUrl,
          tournamentId: state.tournamentId,
          tournamentCountry: state.tournamentCountry,
          numEntrants: state.numEntrants,
          videogameId: state.videogameId,
          colorPalette: state.colorPalette,
          entrantPool: state.entrantPool,
          selectedEntrantId: state.selectedEntrantId,
          playerResults: state.playerResults,
          fallbackCharacters: state.fallbackCharacters,
          setListLayout: state.setListLayout,
          setListStyle: state.setListStyle,
        }),
      },
    ),
  ),
);
