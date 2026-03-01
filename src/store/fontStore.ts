import { create } from "zustand";
import { devtools } from "zustand/middleware";
import Cookies from "js-cookie";

import { fetchAndMapFonts } from "@/utils/top8/fetchAndMapFonts";
import { loadFont } from "@/utils/top8/loadFont";
import { registerCustomFontFace } from "@/utils/top8/registerCustomFont";
import { customFontRepository } from "@/db/repository";
import { COOKIES } from "@/consts/cookies";
import { useHistoryStore } from "@/store/historyStore";

export type Font = {
  fontFamily: string;
  variants: string[];
  files: Record<string, string>;
  isVariableFont: boolean;
  loaded: boolean;
  isCustom?: boolean;
};

interface FontState {
  fonts: Set<Font>;
  selectedFont: string;
  fetching: boolean;
  error?: Error;
  dispatch: (action: FontAction) => void;
  selectFont: (fontFamily: string, skipHistory?: boolean) => Promise<void>;
  setSelectedFontFromHistory: (fontFamily: string) => void;
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
  | { type: "SET_ERROR"; payload: Error }
  | { type: "ADD_CUSTOM_FONTS"; payload: Font[] }
  | { type: "REMOVE_CUSTOM_FONT"; payload: string };

const fontReducer = (state: FontState, action: FontAction): FontState => {
  switch (action.type) {
    case "SET_FONTS":
      return { ...state, fonts: new Set(action.payload) };
    case "FETCH_FONTS_SUCCESS": {
      const existingCustomFonts = Array.from(state.fonts).filter(
        (f) => f.isCustom
      );
      return {
        ...state,
        fetching: false,
        fonts: new Set([...existingCustomFonts, ...action.payload]),
        error: undefined,
      };
    }
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
    case "ADD_CUSTOM_FONTS": {
      const newFamilies = new Set(action.payload.map((f) => f.fontFamily));
      const existing = Array.from(state.fonts).filter(
        (f) => !newFamilies.has(f.fontFamily)
      );
      return {
        ...state,
        fonts: new Set([...action.payload, ...existing]),
      };
    }
    case "REMOVE_CUSTOM_FONT": {
      return {
        ...state,
        fonts: new Set(
          Array.from(state.fonts).filter(
            (f) => f.fontFamily !== action.payload
          )
        ),
        selectedFont:
          state.selectedFont === action.payload
            ? "Noto Sans JP"
            : state.selectedFont,
      };
    }
    default:
      return state;
  }
};

const initialState: Omit<
  FontState,
  "dispatch" | "selectFont" | "setSelectedFontFromHistory"
> = {
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

      selectFont: async (fontFamily: string, skipHistory = false) => {
        const { fonts, dispatch, selectedFont: previousFont } = get();
        const font = Array.from(fonts).find((f) => f.fontFamily === fontFamily);

        if (!font) {
          dispatch({
            type: "SET_ERROR",
            payload: new Error(`Font "${fontFamily}" not found`),
          });
          return;
        }

        const shouldRecordHistory = !skipHistory && fontFamily !== previousFont;

        if (font.loaded) {
          if (shouldRecordHistory) {
            useHistoryStore.getState().pushAction({
              type: "SET_FONT",
              undoData: previousFont,
              redoData: fontFamily,
            });
          }
          dispatch({ type: "SET_SELECTED_FONT", payload: fontFamily });
          return;
        }

        dispatch({ type: "LOAD_FONT", payload: fontFamily });

        try {
          await loadFont(font);
          if (shouldRecordHistory) {
            useHistoryStore.getState().pushAction({
              type: "SET_FONT",
              undoData: previousFont,
              redoData: fontFamily,
            });
          }
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

      setSelectedFontFromHistory: (fontFamily: string) => {
        const { fonts, dispatch } = get();
        const font = Array.from(fonts).find((f) => f.fontFamily === fontFamily);

        if (!font) return;

        if (font.loaded) {
          dispatch({ type: "SET_SELECTED_FONT", payload: fontFamily });
        } else {
          loadFont(font).then(() => {
            dispatch({ type: "LOAD_FONT_SUCCESS", payload: font });
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

const loadCustomFontsFromDB = async (): Promise<Font[]> => {
  const dbFonts = await customFontRepository.getAll();
  const fonts: Font[] = [];

  for (const dbFont of dbFonts) {
    try {
      await registerCustomFontFace(dbFont.fontFamily, dbFont.data);
      fonts.push({
        fontFamily: dbFont.fontFamily,
        variants: ["regular"],
        files: {},
        isVariableFont: false,
        loaded: true,
        isCustom: true,
      });
    } catch (e) {
      console.warn(`Failed to load custom font "${dbFont.fontFamily}":`, e);
    }
  }

  return fonts;
};

Promise.allSettled([fetchFonts(), loadCustomFontsFromDB()])
  .then(async ([googleResult, customResult]) => {
    const dispatch = useFontStore.getState().dispatch;

    const googleFonts =
      googleResult.status === "fulfilled" ? googleResult.value : [];
    const customFonts =
      customResult.status === "fulfilled" ? customResult.value : [];

    if (googleResult.status === "rejected") {
      dispatch({
        type: "FETCH_FONTS_FAIL",
        payload: new Error("Failed to fetch fonts, please refresh the page"),
      });
    } else {
      dispatch({ type: "FETCH_FONTS_SUCCESS", payload: googleFonts });
    }

    if (customFonts.length > 0) {
      dispatch({ type: "ADD_CUSTOM_FONTS", payload: customFonts });
    }

    const allFonts = [...customFonts, ...googleFonts];

    if (allFonts.length > 0) {
      const lastFontFamily = Cookies.get(COOKIES.LAST_USED_FONT_FAMILY);
      let lastFont = googleFonts[0] ?? allFonts[0];

      if (lastFontFamily) {
        const found = allFonts.find((f) => f.fontFamily === lastFontFamily);
        if (found) lastFont = found;
      }

      if (lastFont.loaded) {
        dispatch({ type: "LOAD_FONT_SUCCESS", payload: lastFont });
      } else {
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
    }
  })
  .catch(() => {
    useFontStore.getState().dispatch({
      type: "FETCH_FONTS_FAIL",
      payload: new Error("Failed to fetch fonts, please refresh the page"),
    });
  });
