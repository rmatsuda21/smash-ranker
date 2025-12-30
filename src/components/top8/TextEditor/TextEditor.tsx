import { useMemo } from "react";
import cn from "classnames";
import debounce from "lodash/debounce";

import { useCanvasStore } from "@/store/canvasStore";
import { RichTextInput } from "./RichTextInput";

import styles from "./TextEditor.module.scss";

const DEBOUNCE_TIME = 150;

type Props = {
  className?: string;
};

export const TextEditor = ({ className }: Props) => {
  const textPalette = useCanvasStore(
    (state) => state.design.canvas.textPalette
  );
  const dispatch = useCanvasStore((state) => state.dispatch);

  const debouncedDispatch = useMemo(
    () =>
      debounce((id: string, text: string, name: string) => {
        dispatch({
          type: "UPDATE_TEXT_CONTENT",
          payload: { id, value: { text, name } },
        });
      }, DEBOUNCE_TIME),
    [dispatch]
  );

  const handleTextChange = (id: string, text: string, name: string) => {
    debouncedDispatch(id, text, name);
  };

  if (!textPalette || Object.keys(textPalette).length === 0) {
    return (
      <div className={cn(className, styles.wrapper)}>
        <div className={styles.empty}>
          <p>No text content defined in this design.</p>
          <p className={styles.hint}>
            Text content is configured in the design layout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(className, styles.wrapper)}>
      <p className={styles.description}>
        Edit the text content displayed in your graphic. Use dynamic variables
        to automatically insert tournament and player information.
      </p>

      <div className={styles.textList}>
        {Object.entries(textPalette).map(([id, { text, name }]) => (
          <div key={id} className={styles.textItem}>
            <label className={styles.label}>{name}</label>
            <RichTextInput
              value={text}
              onChange={(newText) => handleTextChange(id, newText, name)}
              placeholder={`Enter ${name.toLowerCase()}...`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
