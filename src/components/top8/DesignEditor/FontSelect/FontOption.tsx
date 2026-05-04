import { memo, useEffect, useState } from "react";

import { DropDownItem } from "@/components/shared/DropDownSelect/DropDownSelect";
import { useFontStore } from "@/store/fontStore";
import { fontsourcePreviewCssUrl } from "@/utils/fonts/fontsourceUrls";

import styles from "./FontOption.module.scss";

type Props = {
  option: DropDownItem<string>;
};

export const FontOption = memo(({ option }: Props) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const fontFamily = option.value;
  const font = useFontStore((state) =>
    Array.from(state.fonts).find((f) => f.fontFamily === fontFamily)
  );
  const isCustom = font?.isCustom ?? false;
  const fontId = font?.id;

  useEffect(() => {
    if (isCustom) {
      setLoaded(true);
      return;
    }

    if (!fontId) {
      if (document.fonts.check(`16px "${fontFamily}"`)) {
        setLoaded(true);
      } else {
        setError(true);
      }
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
    link.href = fontsourcePreviewCssUrl(fontId);
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
  }, [fontFamily, fontId, isCustom]);

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
