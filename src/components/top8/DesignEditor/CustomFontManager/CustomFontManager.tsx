import { useRef, useState } from "react";
import { FaPlus, FaXmark } from "react-icons/fa6";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { useCustomFonts } from "@/hooks/useCustomFonts";
import { useFontStore } from "@/store/fontStore";

import styles from "./CustomFontManager.module.scss";

const FONT_EXTENSIONS = [".ttf", ".otf", ".woff", ".woff2"];
const FONT_ACCEPT = FONT_EXTENSIONS.join(",");

const isFontFile = (file: File) =>
  FONT_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

const hasFiles = (e: React.DragEvent) =>
  Array.from(e.dataTransfer.types).includes("Files");

export const CustomFontManager = () => {
  const { _ } = useLingui();
  const { customFonts, uploadFont, removeFont } = useCustomFonts();
  const selectFont = useFontStore((state) => state.selectFont);
  const [isFileOver, setIsFileOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: File[]) => {
    let lastFont;
    for (const file of files.filter(isFontFile)) {
      const font = await uploadFont(file);
      if (font) lastFont = font;
    }
    if (lastFont) {
      selectFont(lastFont.fontFamily);
    }
  };

  return (
    <div className={styles.wrapper}>
      {customFonts.length > 0 && (
        <ul className={styles.fontList}>
          {customFonts.map((font) => (
            <li key={font.id} className={styles.fontItem}>
              <span
                className={styles.fontName}
                style={{ fontFamily: `"${font.fontFamily}"` }}
                title={font.fontFamily}
              >
                {font.fontFamily}
              </span>
              <button
                type="button"
                className={styles.remove}
                onClick={() => removeFont(font.id)}
                aria-label={_(msg`Remove ${font.fontFamily}`)}
                title={_(msg`Remove ${font.fontFamily}`)}
              >
                <FaXmark size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={FONT_ACCEPT}
        multiple
        className={styles.hiddenInput}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          handleUpload(files);
        }}
      />
      {/* One row that is both the upload button and the drop target. */}
      <button
        type="button"
        className={cn(styles.dropzone, { [styles.isFileOver]: isFileOver })}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          setIsFileOver(true);
        }}
        onDragLeave={() => setIsFileOver(false)}
        onDrop={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          setIsFileOver(false);
          handleUpload(Array.from(e.dataTransfer.files));
        }}
      >
        <FaPlus size={12} />
        <span className={styles.dropzoneLabel}>
          <Trans>Upload font</Trans>
        </span>
        <span className={styles.dropzoneHint}>TTF, OTF, WOFF</span>
      </button>
    </div>
  );
};
