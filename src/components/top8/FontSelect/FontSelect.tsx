import { useEffect, useMemo, useState } from "react";

import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";
import { useCanvasStore } from "@/store/canvasStore";
import { loadFont } from "@/utils/top8/loadFont";
import { FontList, fetchAndMapFonts } from "@/utils/top8/fetchAndMapFonts";

export const FontSelect = () => {
  const [fontList, setFontList] = useState<FontList>({});

  const { selectedFont, dispatch } = useCanvasStore();

  useEffect(() => {
    fetchAndMapFonts({ limit: 100 }).then((fonts) => {
      setFontList(fonts);
    });
  }, []);

  const fontOptions = useMemo(() => {
    return Object.entries(fontList).map(([fontFamily, font]) => {
      const fontKeys = Object.keys(font.files);
      const fontKey =
        fontKeys.find((key) => key === "regular" || key === "600") ??
        fontKeys[0];
      const fontUrl = font.files[fontKey];

      return {
        value: fontFamily,
        id: fontUrl,
        display: fontFamily,
      };
    });
  }, [fontList]);

  const handleChange = (values: any[]) => {
    if (values.length > 0) {
      const fontFamily = values[0].value;
      const font = fontList[fontFamily];

      dispatch({ type: "LOAD_FONT", payload: fontFamily });
      loadFont({
        fontFamily,
        variants: font.variants,
        files: font.files,
        isVariableFont: font.isVariableFont,
      })
        .then(() => {
          dispatch({ type: "FONT_LOADED", payload: fontFamily });
        })
        .catch(() => {
          dispatch({ type: "FONT_FAILED", payload: fontFamily });
        })
        .finally(() => {
          dispatch({ type: "SET_SELECTED_FONT", payload: fontFamily });
        });
    }
  };

  const selectedFontOption = useMemo(() => {
    return fontOptions.find((option) => option.value === selectedFont);
  }, [fontOptions, selectedFont]);

  return (
    <DropDownSelect
      options={fontOptions}
      selectedValue={selectedFontOption?.value}
      onChange={handleChange}
    />
  );
};
