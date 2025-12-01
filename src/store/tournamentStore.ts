import { create } from "zustand";

import { TournamentInfo } from "@/types/top8/TournamentTypes";
interface TournamentState {
  info: TournamentInfo;
  fetching: boolean;
  error: string;
  selectedElementIndex: number;
}

type TournamentAction =
  | { type: "SET_TOURNAMENT_NAME"; payload: string }
  | { type: "SET_EVENT_NAME"; payload: string }
  | { type: "SET_DATE"; payload: Date }
  | { type: "SET_LOCATION"; payload: string }
  | { type: "SET_ENTRANTS"; payload: number }
  | { type: "SET_TOURNAMENT_INFO"; payload: TournamentInfo }
  | { type: "SET_FETCHING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_SELECTED_ELEMENT_INDEX"; payload: number }
  | { type: "CLEAR_SELECTED_ELEMENT" }
  | { type: "RESET" };

const tournamentReducer = (
  state: TournamentState,
  action: TournamentAction
): Partial<TournamentState> => {
  switch (action.type) {
    case "SET_TOURNAMENT_NAME":
      return {
        info: { ...state.info, tournamentName: action.payload },
      };
    case "SET_EVENT_NAME":
      return { info: { ...state.info, eventName: action.payload } };
    case "SET_DATE":
      return { info: { ...state.info, date: action.payload } };
    case "SET_LOCATION":
      return { info: { ...state.info, location: action.payload } };
    case "SET_ENTRANTS":
      return { info: { ...state.info, entrants: action.payload } };
    case "SET_TOURNAMENT_INFO":
      return { info: action.payload };
    case "SET_FETCHING":
      return { fetching: action.payload };
    case "SET_ERROR":
      return { error: action.payload };
    case "SET_SELECTED_ELEMENT_INDEX":
      return { selectedElementIndex: action.payload };
    case "CLEAR_SELECTED_ELEMENT":
      return { selectedElementIndex: -1 };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const initialState: TournamentState = {
  info: {
    tournamentName: `Tournament Name`,
    eventName: `Event Name`,
    date: new Date(1999, 10, 7),
    location: `Somewhere, World`,
    entrants: 69,
  },
  fetching: false,
  error: "",
  selectedElementIndex: -1,
};

interface TournamentStore extends TournamentState {
  dispatch: (action: TournamentAction) => void;
}

export const useTournamentStore = create<TournamentStore>((set) => ({
  ...initialState,
  dispatch: (action: TournamentAction) =>
    set((state) => tournamentReducer(state, action)),
}));
