import { useCallback, useMemo } from "react";

import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";
import { loadFont } from "@/utils/top8/loadFont";
import { Font, useFontStore } from "@/store/fontStore";

export const FontSelect = () => {
  // TODO: Add error handling
  // const error = useFontStore((state) => state.error);
  const fonts = useFontStore((state) => state.fonts);
  const fetching = useFontStore((state) => state.fetching);
  const selectedFont = useFontStore((state) => state.selectedFont);
  const dispatch = useFontStore((state) => state.dispatch);

  const loadAndDispatchFont = useCallback(
    (font: Font) => {
      if (font.loaded) {
        dispatch({ type: "SET_SELECTED_FONT", payload: font.fontFamily });
        return;
      }

      dispatch({ type: "LOAD_FONT", payload: font.fontFamily });

      loadFont(font)
        .then(() => {
          dispatch({ type: "LOAD_FONT_SUCCESS", payload: font });
        })
        .catch((error) => {
          console.error(`Failed to load font "${font.fontFamily}":`, error);
          dispatch({ type: "LOAD_FONT_FAIL", payload: { error } });
        });
    },
    [dispatch]
  );

  const fontOptions = useMemo(() => {
    return Array.from(fonts).map((font) => ({
      value: font.fontFamily,
      id: font.fontFamily,
      display: font.fontFamily,
    }));
  }, [fonts]);

  const handleChange = useCallback(
    (fontFamily: string) => {
      const font = Array.from(fonts).find(
        (font) => font.fontFamily === fontFamily
      );

      if (font) {
        loadAndDispatchFont(font);
      }
    },
    [fonts, loadAndDispatchFont]
  );

  return (
    <DropDownSelect
      options={fontOptions}
      selectedValue={selectedFont}
      onChange={handleChange}
      disabled={fetching}
      loading={fetching}
    />
  );
};
