import { memo, useEffect, useState } from "react";

import { DropDownItem } from "@/components/top8/DropDownSelect/DropDownSelect";
import { useFontStore } from "@/store/fontStore";

import styles from "./FontOption.module.scss";

type Props = {
  option: DropDownItem<string>;
};

const getGoogleFontPreviewUrl = (fontFamily: string, previewText: string) => {
  const encodedFamily = encodeURIComponent(fontFamily);
  const encodedText = encodeURIComponent(previewText);
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}&text=${encodedText}&display=swap`;
};

export const FontOption = memo(({ option }: Props) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const fontFamily = option.value;
  const isCustom = useFontStore((state) =>
    Array.from(state.fonts).some(
      (f) => f.fontFamily === fontFamily && f.isCustom
    )
  );

  useEffect(() => {
    if (isCustom) {
      setLoaded(true);
      return;
    }

    const existingLink = document.querySelector(
      `link[data-font-preview="${fontFamily}"]`
    );
    if (existingLink) {
      setLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = getGoogleFontPreviewUrl(fontFamily, fontFamily);
    link.setAttribute("data-font-preview", fontFamily);

    link.onload = () => {
      setLoaded(true);
    };

    link.onerror = () => {
      if (document.fonts.check(`16px "${fontFamily}"`)) {
        setLoaded(true);
      } else {
        setError(true);
      }
    };

    document.head.appendChild(link);
  }, [fontFamily]);

  return (
    <span
      className={styles.fontOption}
      style={{
        fontFamily:
          loaded && !error ? `"${fontFamily}", sans-serif` : "inherit",
      }}
    >
      {option.display}
    </span>
  );
});

FontOption.displayName = "FontOption";
