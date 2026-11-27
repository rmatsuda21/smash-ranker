import { useState, useEffect, useCallback } from "react";
import { useLingui } from "@lingui/react/macro";

import { useToast } from "@/components/Toast";

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
import { logEvent, logWarning, setPerson } from "@/utils/observability/log";
import { requestPersistentStorage } from "@/utils/persistentStorage";

export const useCustomFonts = () => {
  const [customFonts, setCustomFonts] = useState<DBCustomFont[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useFontStore((state) => state.dispatch);
  const { showToast } = useToast();
  const { t } = useLingui();

  useEffect(() => {
    customFontRepository
      .getAll()
      .then(setCustomFonts)
      .catch((error) =>
        logWarning("custom fonts failed to load", {
          area: "fonts",
          error: error instanceof Error ? error.message : String(error),
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const uploadFont = useCallback(
    async (file: File): Promise<Font | null> => {
      const fontFamily = getFontFamilyFromFileName(file.name);

      const allFonts = useFontStore.getState().fonts;
      const duplicate = Array.from(allFonts).find(
        (f) => f.fontFamily === fontFamily,
      );
      if (duplicate) {
        showToast(t`Font "${fontFamily}" is already added.`, {
          variant: "error",
        });
        logEvent("custom_font_upload_fail", {
          failure_kind: "duplicate_family",
          size_kb: Math.round(file.size / 1024),
        });
        return null;
      }

      const id = crypto.randomUUID();
      const sizeKb = Math.round(file.size / 1024);

      // The browser parses the file here: one that is damaged, or not a
      // font under a font's extension, is refused.
      try {
        await registerCustomFontFace(fontFamily, file);
      } catch {
        showToast(t`"${file.name}" isn't a font file this browser can read.`, {
          variant: "error",
        });
        logEvent("custom_font_upload_fail", {
          failure_kind: "invalid_font",
          size_kb: sizeKb,
        });
        return null;
      }
      registerCustomFamily(fontFamily);

      const dbFont: DBCustomFont = {
        id,
        fontFamily,
        fileName: file.name,
        data: file,
        date: new Date(),
      };

      // Without a stored copy the font is gone after a reload, so it is
      // not added at all.
      try {
        await customFontRepository.put(dbFont);
      } catch (error) {
        Array.from(document.fonts)
          .filter((face) => face.family === fontFamily)
          .forEach((face) => document.fonts.delete(face));
        unregisterCustomFamily(fontFamily);
        logWarning("custom font save failed", {
          area: "fonts",
          error: error instanceof Error ? error.message : String(error),
          size_kb: sizeKb,
        });
        showToast(t`Couldn't save "${fontFamily}". Try again.`, {
          variant: "error",
        });
        return null;
      }
      requestPersistentStorage();

      const font: Font = {
        fontFamily,
        weights: [400],
        isCustom: true,
      };

      dispatch({ type: "ADD_CUSTOM_FONTS", payload: [font] });
      setCustomFonts((prev) => [...prev, dbFont]);
      logEvent("custom_font_upload", {
        size_kb: Math.round(file.size / 1024),
      });
      setPerson({ has_uploaded_custom_font: true });

      return font;
    },
    [dispatch, showToast, t],
  );

  const removeFont = useCallback(
    async (id: string) => {
      let font: DBCustomFont | undefined;
      try {
        font = await customFontRepository.get(id);
        if (!font) return;
        await customFontRepository.delete(id);
      } catch (error) {
        logWarning("custom font delete failed", {
          area: "fonts",
          error: error instanceof Error ? error.message : String(error),
        });
        showToast(t`Couldn't remove the font. Try again.`, {
          variant: "error",
        });
        return;
      }
      const removed = font;

      const facesToDelete = Array.from(document.fonts).filter(
        (ff) => ff.family === removed.fontFamily,
      );
      facesToDelete.forEach((ff) => document.fonts.delete(ff));

      unregisterCustomFamily(removed.fontFamily);
      dispatch({ type: "REMOVE_CUSTOM_FONT", payload: removed.fontFamily });
      setCustomFonts((prev) => prev.filter((f) => f.id !== id));
    },
    [dispatch, showToast, t],
  );

  return { customFonts, loading, uploadFont, removeFont };
};
