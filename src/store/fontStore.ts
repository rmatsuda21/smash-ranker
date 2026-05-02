import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { fetchAndMapFonts } from "@/utils/top8/fetchAndMapFonts";
import { loadFont } from "@/utils/top8/loadFont";
import { registerCustomFontFace } from "@/utils/top8/registerCustomFont";
import { customFontRepository } from "@/db/repository";
import { useCanvasStore } from "@/store/canvasStore";

const DEFAULT_FONT = "Dela Gothic One";

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

const initialState: Omit<FontState, "dispatch" | "selectFont"> = {
  fonts: new Set(),
  selectedFont: DEFAULT_FONT,
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

        const sameFont = fontFamily === previousFont;

        if (!font.loaded) {
          dispatch({ type: "LOAD_FONT", payload: fontFamily });
          try {
            await loadFont(font);
            dispatch({ type: "LOAD_FONT_SUCCESS", payload: font });
          } catch (error) {
            dispatch({
              type: "LOAD_FONT_FAIL",
              payload: {
                error:
                  error instanceof Error ? error : new Error(String(error)),
              },
            });
            return;
          }
        } else if (!sameFont) {
          dispatch({ type: "SET_SELECTED_FONT", payload: fontFamily });
        }

        if (sameFont) return;

        useCanvasStore
          .getState()
          .dispatch({ type: "SET_FONT", payload: fontFamily }, skipHistory);
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

    if (allFonts.length === 0) return;

    const activeFontFamily = useCanvasStore.getState().font;
    const activeFont =
      allFonts.find((f) => f.fontFamily === activeFontFamily) ??
      googleFonts[0] ??
      allFonts[0];

    if (activeFont.loaded) {
      dispatch({ type: "LOAD_FONT_SUCCESS", payload: activeFont });
    } else {
      try {
        await loadFont(activeFont);
        dispatch({ type: "LOAD_FONT_SUCCESS", payload: activeFont });
      } catch {
        dispatch({
          type: "LOAD_FONT_FAIL",
          payload: { error: new Error("Failed to load font") },
        });
      }
    }
  })
  .catch(() => {
    useFontStore.getState().dispatch({
      type: "FETCH_FONTS_FAIL",
      payload: new Error("Failed to fetch fonts, please refresh the page"),
    });
  });
