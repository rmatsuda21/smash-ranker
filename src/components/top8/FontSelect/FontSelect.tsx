import { useEffect, useMemo, useState } from "react";

import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";
import { useCanvasStore } from "@/store/canvasStore";
import { loadFont } from "@/utils/top8/loadFont";

export const FontSelect = () => {
  const [fontList, setFontList] = useState<
    { family: string; files: Record<string, string> }[]
  >([]);

  const { selectedFont, dispatch } = useCanvasStore();

  useEffect(() => {
    const fetchFontList = async () => {
      const url = `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${
        import.meta.env.VITE_GOOGLE_API_KEY
      }`;

      const response = await fetch(url);
      const data = await response.json();

      const limitedItems = data.items.slice(0, 100);
      setFontList(
        limitedItems.map((item: any) => ({
          family: item.family,
          files: item.files,
        }))
      );
    };

    fetchFontList();
  }, []);

  const fontOptions = useMemo(() => {
    return fontList.map((font) => {
      const fontKeys = Object.keys(font.files);
      const fontKey =
        fontKeys.find((key) => key === "regular" || key === "600") ??
        fontKeys[0];
      const fontUrl = font.files[fontKey];

      return {
        value: font.family,
        id: fontUrl,
        display: font.family,
      };
    });
  }, [fontList]);

  const handleChange = (values: any[]) => {
    if (values.length > 0) {
      const url = values[0].id;
      const fontFamily = values[0].value;

      dispatch({ type: "LOAD_FONT", payload: fontFamily });
      loadFont({
        fontName: fontFamily,
        fontStyle: "normal",
        fontWeight: "400",
        fontUrl: url,
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
