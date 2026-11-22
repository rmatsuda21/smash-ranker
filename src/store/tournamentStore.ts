import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

import { TournamentInfo } from "@/types/top8/Tournament";
import { GameId } from "@/types/Game";
import { DEFAULT_GAME } from "@/consts/games";
import { SAMPLE_TOURNAMENT } from "@/utils/top8/sampleTournament";

interface TournamentState {
  info: TournamentInfo;
  // Which game's characters the pickers list.
  game: GameId;
  fetching: boolean;
  error: string;
  selectedElementIndex: number;
}

type TournamentAction =
  | { type: "SET_TOURNAMENT_NAME"; payload: string }
  | { type: "SET_EVENT_NAME"; payload: string }
  | { type: "SET_DATE"; payload: string }
  | {
      type: "SET_LOCATION";
      payload: { city?: string; state?: string; country?: string };
    }
  | { type: "SET_ENTRANTS"; payload: number }
  | { type: "SET_TOURNAMENT_INFO"; payload: TournamentInfo }
  | { type: "SET_FETCHING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_SELECTED_ELEMENT_INDEX"; payload: number }
  | { type: "CLEAR_SELECTED_ELEMENT" }
  | { type: "SET_ICON"; payload: string }
  | { type: "CLEAR_ICON" }
  | { type: "SET_GAME"; payload: GameId }
  | { type: "RESET" };

const tournamentReducer = (
  state: TournamentState,
  action: TournamentAction,
): Partial<TournamentState> => {
  switch (action.type) {
    case "SET_TOURNAMENT_NAME":
      return {
        info: { ...state.info, tournamentName: action.payload },
      };
    case "SET_EVENT_NAME":
      return { info: { ...state.info, eventName: action.payload } };
    case "SET_DATE":
      return {
        info: {
          ...state.info,
          date: action.payload,
        },
      };
    case "SET_LOCATION":
      return {
        info: {
          ...state.info,
          location: { ...state.info.location, ...action.payload },
        },
      };
    case "SET_ENTRANTS":
      return { info: { ...state.info, entrants: action.payload } };
    case "SET_TOURNAMENT_INFO":
      return {
        info: {
          ...state.info,
          ...action.payload,
          ...(action.payload.url !== undefined && {
            url: action.payload.url.replace(/^(https?:\/\/)?(www\.)/i, ""),
          }),
        },
      };
    case "SET_FETCHING":
      return { fetching: action.payload };
    case "SET_ERROR":
      return { error: action.payload };
    case "SET_SELECTED_ELEMENT_INDEX":
      return { selectedElementIndex: action.payload };
    case "CLEAR_SELECTED_ELEMENT":
      return { selectedElementIndex: -1 };
    case "SET_ICON":
      return { info: { ...state.info, iconSrc: action.payload } };
    case "CLEAR_ICON":
      return { info: { ...state.info, iconSrc: undefined } };
    case "SET_GAME":
      return { game: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const initialState: TournamentState = {
  info: SAMPLE_TOURNAMENT,
  game: DEFAULT_GAME,
  fetching: false,
  error: "",
  selectedElementIndex: -1,
};

interface TournamentStore extends TournamentState {
  dispatch: (action: TournamentAction) => void;
}

export const useTournamentStore = create<TournamentStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        dispatch: (action: TournamentAction) =>
          set((state) => tournamentReducer(state, action), false, action),
      }),
      {
        name: "tournament-store",
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
);
