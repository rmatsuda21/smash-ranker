import { IoIosRemoveCircle } from "react-icons/io";

import { FileUploader } from "@/components/shared/FileUploader/FileUploader";
import { Button } from "@/components/shared/Button/Button";
import { useCustomFonts } from "@/hooks/useCustomFonts";
import { useFontStore } from "@/store/fontStore";

import styles from "./CustomFontManager.module.scss";

const FONT_ACCEPT = ".ttf,.otf,.woff,.woff2";

export const CustomFontManager = () => {
  const { customFonts, uploadFont, removeFont } = useCustomFonts();
  const selectFont = useFontStore((state) => state.selectFont);

  const handleUpload = async (files?: File[]) => {
    if (!files || files.length === 0) return;
    let lastFont;
    for (const file of files) {
      const font = await uploadFont(file);
      if (font) lastFont = font;
    }
    if (lastFont) {
      selectFont(lastFont.fontFamily);
    }
  };

  return (
    <div className={styles.wrapper}>
      <FileUploader accept={FONT_ACCEPT} onChange={handleUpload} multiple />
      {customFonts.length > 0 && (
        <ul className={styles.fontList}>
          {customFonts.map((font) => (
            <li key={font.id} className={styles.fontItem}>
              <span
                className={styles.fontName}
                style={{ fontFamily: `"${font.fontFamily}"` }}
              >
                {font.fontFamily}
              </span>
              <Button size="sm" onClick={() => removeFont(font.id)}>
                <IoIosRemoveCircle />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
