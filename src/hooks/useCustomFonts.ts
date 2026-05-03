import { useState, useEffect, useCallback } from "react";

import { DBCustomFont } from "@/types/Repository";
import { customFontRepository } from "@/db/repository";
import { useFontStore, Font } from "@/store/fontStore";
import {
  registerCustomFontFace,
  getFontFamilyFromFileName,
} from "@/utils/top8/registerCustomFont";
import {
  registerCustomFamily,
  unregisterCustomFamily,
} from "@/utils/fonts/fontLoader";

export const useCustomFonts = () => {
  const [customFonts, setCustomFonts] = useState<DBCustomFont[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useFontStore((state) => state.dispatch);

  useEffect(() => {
    customFontRepository
      .getAll()
      .then(setCustomFonts)
      .finally(() => setLoading(false));
  }, []);

  const uploadFont = useCallback(
    async (file: File): Promise<Font | null> => {
      const fontFamily = getFontFamilyFromFileName(file.name);

      const allFonts = useFontStore.getState().fonts;
      const duplicate = Array.from(allFonts).find(
        (f) => f.fontFamily === fontFamily
      );
      if (duplicate) {
        alert(`Font "${fontFamily}" is already added.`);
        return null;
      }

      const id = crypto.randomUUID();

      await registerCustomFontFace(fontFamily, file);
      registerCustomFamily(fontFamily);

      const dbFont: DBCustomFont = {
        id,
        fontFamily,
        fileName: file.name,
        data: file,
        date: new Date(),
      };

      await customFontRepository.put(dbFont);

      const font: Font = {
        fontFamily,
        weights: [400],
        isCustom: true,
      };

      dispatch({ type: "ADD_CUSTOM_FONTS", payload: [font] });
      setCustomFonts((prev) => [...prev, dbFont]);

      return font;
    },
    [dispatch]
  );

  const removeFont = useCallback(
    async (id: string) => {
      const font = await customFontRepository.get(id);
      if (!font) return;

      await customFontRepository.delete(id);

      const facesToDelete = Array.from(document.fonts).filter(
        (ff) => ff.family === font.fontFamily
      );
      facesToDelete.forEach((ff) => document.fonts.delete(ff));

      unregisterCustomFamily(font.fontFamily);
      dispatch({ type: "REMOVE_CUSTOM_FONT", payload: font.fontFamily });
      setCustomFonts((prev) => prev.filter((f) => f.id !== id));
    },
    [dispatch]
  );

  return { customFonts, loading, uploadFont, removeFont };
};
