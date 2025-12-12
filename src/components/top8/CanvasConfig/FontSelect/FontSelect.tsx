import { useCallback, useEffect, useMemo, useState } from "react";

import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";
import { useCanvasStore } from "@/store/canvasStore";
import { loadFont } from "@/utils/top8/loadFont";
import { FontList, fetchAndMapFonts } from "@/utils/top8/fetchAndMapFonts";

const FONT_FETCH_LIMIT = 100;
const PREFERRED_FONT_VARIANTS = ["regular", "600"] as const;

type FontOption = {
  value: string;
  id: string;
  display: string;
};

type FontData = {
  fontFamily: string;
  variants: string[];
  files: Record<string, string>;
  isVariableFont: boolean;
};

const selectFontUrl = (fontFiles: Record<string, string>) => {
  const availableVariants = Object.keys(fontFiles);
  const preferredVariant = PREFERRED_FONT_VARIANTS.find((variant) =>
    availableVariants.includes(variant)
  );
  const selectedVariant = preferredVariant ?? availableVariants[0];
  return fontFiles[selectedVariant];
};

export const FontSelect = () => {
  const [fontList, setFontList] = useState<FontList>({});
  const [fetchError, setFetchError] = useState<string | null>(null);

  const selectedFont = useCanvasStore((state) => state.selectedFont);
  const fetchingFont = useCanvasStore((state) => state.fetchingFont);
  const dispatch = useCanvasStore((state) => state.dispatch);

  const loadAndDispatchFont = useCallback(
    (font: FontData) => {
      const { fontFamily, variants, files, isVariableFont } = font;

      dispatch({ type: "LOAD_FONT", payload: fontFamily });

      loadFont({ fontFamily, variants, files, isVariableFont })
        .then(() => {
          dispatch({ type: "FONT_LOADED", payload: fontFamily });
        })
        .catch((error) => {
          console.error(`Failed to load font "${fontFamily}":`, error);
          dispatch({ type: "FONT_FAILED", payload: fontFamily });
        });
    },
    [dispatch]
  );

  useEffect(() => {
    const fetchFonts = async () => {
      try {
        dispatch({ type: "SET_FETCHING_FONT", payload: true });
        setFetchError(null);
        const fonts = await fetchAndMapFonts({ limit: FONT_FETCH_LIMIT });
        setFontList(fonts);
        return fonts;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch fonts";
        setFetchError(errorMessage);
        console.error("Error fetching fonts:", error);
        return null;
      } finally {
        dispatch({ type: "SET_FETCHING_FONT", payload: false });
      }
    };

    const initializeFonts = async () => {
      const fonts = await fetchFonts();
      if (!fonts) return;

      const firstFont = Object.values(fonts)[0];
      if (firstFont) {
        loadAndDispatchFont(firstFont);
      }
    };

    initializeFonts();
  }, [dispatch, loadAndDispatchFont]);

  const fontOptions = useMemo<FontOption[]>(() => {
    return Object.entries(fontList).map(([fontFamily, font]) => ({
      value: fontFamily,
      id: selectFontUrl(font.files),
      display: fontFamily,
    }));
  }, [fontList]);

  const selectedFontValue = useMemo(() => {
    if (!selectedFont || fontOptions.length === 0) return undefined;
    return fontOptions.find((option) => option.value === selectedFont)?.value;
  }, [selectedFont, fontOptions]);

  const handleChange = useCallback(
    (values: FontOption[]) => {
      if (values.length === 0) return;

      const selectedFontFamily = values[0].value;
      const font = fontList[selectedFontFamily];

      if (!font) {
        console.error(`Font "${selectedFontFamily}" not found in fontList`);
        return;
      }

      loadAndDispatchFont(font);
    },
    [fontList, loadAndDispatchFont]
  );

  if (fetchError) {
    return <div>Error loading fonts: {fetchError}</div>;
  }

  return (
    <DropDownSelect
      options={fontOptions}
      selectedValue={selectedFontValue}
      onChange={handleChange}
      disabled={fetchingFont}
      loading={fetchingFont}
    />
  );
};
