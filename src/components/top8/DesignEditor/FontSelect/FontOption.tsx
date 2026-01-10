import { memo, useEffect, useRef, useState } from "react";

import { DropDownItem } from "@/components/top8/DropDownSelect/DropDownSelect";

import styles from "./FontOption.module.scss";

type Props = {
  option: DropDownItem<string>;
  isSelected: boolean;
};

const getGoogleFontPreviewUrl = (fontFamily: string, previewText: string) => {
  const encodedFamily = encodeURIComponent(fontFamily);
  const encodedText = encodeURIComponent(previewText);
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}&text=${encodedText}&display=swap`;
};

export const FontOption = memo(({ option }: Props) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const linkRef = useRef<HTMLLinkElement | null>(null);
  const fontFamily = option.value;

  useEffect(() => {
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
    linkRef.current = link;

    link.onload = () => {
      setLoaded(true);
    };

    link.onerror = () => {
      setError(true);
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
