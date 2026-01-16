import { useMemo } from "react";
import cn from "classnames";
import debounce from "lodash/debounce";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { useCanvasStore } from "@/store/canvasStore";
import { RichTextInput } from "./RichTextInput";

import styles from "./TextEditor.module.scss";

const DEBOUNCE_TIME = 150;

type Props = {
  className?: string;
};

export const TextEditor = ({ className }: Props) => {
  const { _ } = useLingui();
  const textPalette = useCanvasStore((state) => state.design.textPalette);
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
      <div className={cn(className, styles.textEditor)}>
        <div className={styles.empty}>
          <p>
            <Trans>No text content defined in this design.</Trans>
          </p>
          <p className={styles.hint}>
            <Trans>Text content is configured in the design layout.</Trans>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(className, styles.textEditor)}>
      <div className={styles.description}>
        <p>
          <Trans>
            Edit the text content displayed in your graphic. Use dynamic
            variables to insert tournament and player information.
          </Trans>
        </p>
        <p className={styles.tip}>
          <Trans>
            <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Z</kbd> to undo and{" "}
            <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Y</kbd> to redo.
          </Trans>
        </p>
        <p className={styles.tip}>
          <Trans>
            Type <code>{"{"}</code> to insert a variable!
          </Trans>
        </p>
      </div>

      <div className={styles.list}>
        {Object.entries(textPalette).map(([id, { text, name }]) => (
          <div key={id} className={styles.item}>
            <span className={styles.label}>{name}</span>
            <RichTextInput
              value={text}
              onChange={(newText) => handleTextChange(id, newText, name)}
              placeholder={_(msg`Enter ${name.toLowerCase()}...`)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
