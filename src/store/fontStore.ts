import { create } from "zustand";
import { devtools } from "zustand/middleware";
import Cookies from "js-cookie";

import { fetchAndMapFonts } from "@/utils/top8/fetchAndMapFonts";
import { loadFont } from "@/utils/top8/loadFont";
import { COOKIES } from "@/consts/cookies";

export type Font = {
  fontFamily: string;
  variants: string[];
  files: Record<string, string>;
  isVariableFont: boolean;
  loaded: boolean;
};

interface FontState {
  fonts: Set<Font>;
  selectedFont: string;
  fetching: boolean;
  error?: Error;
  dispatch: (action: FontAction) => void;
  selectFont: (fontFamily: string) => Promise<void>;
}

type FontAction =
  | { type: "FETCH_FONTS" }
  | { type: "SET_FONTS"; payload: Font[] }
  | { type: "FETCH_FONTS_SUCCESS"; payload: Font[] }
  | { type: "FETCH_FONTS_FAIL"; payload: Error }
  | { type: "LOAD_FONT"; payload: string }
  | {
      type: "LOAD_FONT_SUCCESS";
      payload: Font;
    }
  | { type: "LOAD_FONT_FAIL"; payload: { error: Error } }
  | { type: "SET_SELECTED_FONT"; payload: string }
  | { type: "SET_FETCHING"; payload: boolean }
  | { type: "SET_ERROR"; payload: Error };

const fontReducer = (state: FontState, action: FontAction): FontState => {
  switch (action.type) {
    case "SET_FONTS":
      return { ...state, fonts: new Set(action.payload) };
    case "FETCH_FONTS_SUCCESS":
      return {
        ...state,
        fetching: false,
        fonts: new Set(action.payload),
        error: undefined,
      };
    case "FETCH_FONTS_FAIL":
      return { ...state, fetching: false, error: action.payload };
    case "LOAD_FONT":
      return {
        ...state,
        fetching: true,
      };
    case "LOAD_FONT_SUCCESS":
      Cookies.set(COOKIES.LAST_USED_FONT_FAMILY, action.payload.fontFamily);
      return {
        ...state,
        fetching: false,
        fonts: new Set(
          Array.from(state.fonts).map((font) =>
            font.fontFamily === action.payload.fontFamily
              ? { ...font, loaded: true }
              : font
          )
        ),
        selectedFont: action.payload.fontFamily,
        error: undefined,
      };
    case "LOAD_FONT_FAIL":
      return {
        ...state,
        fetching: false,
        error: action.payload.error,
      };
    case "SET_SELECTED_FONT":
      Cookies.set(COOKIES.LAST_USED_FONT_FAMILY, action.payload);
      return {
        ...state,
        selectedFont: action.payload,
      };
    case "SET_FETCHING":
      return { ...state, fetching: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const initialState: Omit<FontState, "dispatch" | "selectFont"> = {
  fonts: new Set(),
  selectedFont: "Arial",
  fetching: true,
  error: undefined,
};

export const useFontStore = create<FontState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      dispatch: (action: FontAction) =>
        set((state) => fontReducer(state, action)),

      selectFont: async (fontFamily: string) => {
        const { fonts, dispatch } = get();
        const font = Array.from(fonts).find((f) => f.fontFamily === fontFamily);

        if (!font) {
          dispatch({
            type: "SET_ERROR",
            payload: new Error(`Font "${fontFamily}" not found`),
          });
          return;
        }

        if (font.loaded) {
          dispatch({ type: "SET_SELECTED_FONT", payload: fontFamily });
          return;
        }

        dispatch({ type: "LOAD_FONT", payload: fontFamily });

        try {
          await loadFont(font);
          dispatch({ type: "LOAD_FONT_SUCCESS", payload: font });
        } catch (error) {
          dispatch({
            type: "LOAD_FONT_FAIL",
            payload: {
              error: error instanceof Error ? error : new Error(String(error)),
            },
          });
        }
      },
    }),
    { name: "font-store" }
  )
);

const fetchFonts = async (): Promise<Font[]> => {
  const fonts = await fetchAndMapFonts({ limit: 100 });
  return fonts;
};

fetchFonts()
  .then(async (fonts) => {
    const dispatch = useFontStore.getState().dispatch;
    dispatch({ type: "FETCH_FONTS_SUCCESS", payload: fonts });
    if (fonts.length > 0) {
      const lastFontFamily = Cookies.get(COOKIES.LAST_USED_FONT_FAMILY);
      let lastFont = fonts[0];

      if (lastFontFamily) {
        const lastUsedFont = fonts.find(
          (font) => font.fontFamily === lastFontFamily
        );
        if (lastUsedFont) lastFont = lastUsedFont;
      }

      const loaded = await loadFont(lastFont);
      if (loaded) {
        dispatch({ type: "LOAD_FONT_SUCCESS", payload: lastFont });
      } else {
        dispatch({
          type: "LOAD_FONT_FAIL",
          payload: { error: new Error("Failed to load font") },
        });
      }
    }
  })
  .catch((e) => {
    const dispatch = useFontStore.getState().dispatch;
    dispatch({ type: "FETCH_FONTS_FAIL", payload: e });
  });
