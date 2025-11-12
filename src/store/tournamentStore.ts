import { create } from "zustand";

interface TournamentState {
  name: string;
  date: string;
  location: string;
  entrants: number;
}

type TournamentAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_DATE"; payload: string }
  | { type: "SET_LOCATION"; payload: string }
  | { type: "SET_ENTRANTS"; payload: number }
  | { type: "SET_TOURNAMENT"; payload: TournamentState }
  | { type: "RESET" };

const tournamentReducer = (
  state: TournamentState,
  action: TournamentAction
): TournamentState => {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.payload };
    case "SET_DATE":
      return { ...state, date: action.payload };
    case "SET_LOCATION":
      return { ...state, location: action.payload };
    case "SET_ENTRANTS":
      return { ...state, entrants: action.payload };
    case "SET_TOURNAMENT":
      return { ...state, ...action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const initialState: TournamentState = {
  name: `Tournament Name`,
  date: `1999-11-07`,
  location: `Somewhere, World`,
  entrants: 69,
};

interface TournamentStore extends TournamentState {
  dispatch: (action: TournamentAction) => void;
}

export const useTournamentStore = create<TournamentStore>((set) => ({
  ...initialState,
  dispatch: (action: TournamentAction) =>
    set((state) => tournamentReducer(state, action)),
}));
