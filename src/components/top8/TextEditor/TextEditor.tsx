import { useMemo } from "react";
import debounce from "lodash/debounce";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Trans as TransRuntime } from "@lingui/react";
import { useLingui } from "@lingui/react";

import { useCanvasStore } from "@/store/canvasStore";
import {
  EditorCard,
  EditorPanel,
  FieldGroup,
} from "@/components/top8/EditorForm/EditorForm";
import { RichTextInput } from "./RichTextInput";

import styles from "./TextEditor.module.scss";

const DEBOUNCE_TIME = 150;

type Props = {
  className?: string;
};

export const TextEditor = ({ className }: Props) => {
  const { i18n, _ } = useLingui();
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
    [dispatch],
  );

  const handleTextChange = (id: string, text: string, name: string) => {
    debouncedDispatch(id, text, name);
  };

  if (!textPalette || Object.keys(textPalette).length === 0) {
    return (
      <EditorPanel className={className}>
        <EditorCard className={styles.empty}>
          <p className={styles.emptyTitle}>
            <Trans>No text content defined in this design.</Trans>
          </p>
          <p className={styles.hint}>
            <Trans>Text content is configured in the design layout.</Trans>
          </p>
        </EditorCard>
      </EditorPanel>
    );
  }

  return (
    <EditorPanel className={className}>
      <EditorCard>
        <div className={styles.intro}>
          <p>
            <Trans>Edit the text content displayed in your graphic.</Trans>
          </p>
          <p className={styles.hint}>
            <Trans>
              Select a field to insert live tournament details, such as its name
              or date.
            </Trans>
          </p>
        </div>

        {Object.entries(textPalette).map(([id, { text, name }]) => {
          const translatedName = i18n._(name);
          return (
            <FieldGroup
              key={id}
              label={<TransRuntime id={name} message={name} />}
            >
              <RichTextInput
                value={text}
                onChange={(newText) => handleTextChange(id, newText, name)}
                placeholder={_(msg`Enter ${translatedName.toLowerCase()}...`)}
              />
            </FieldGroup>
          );
        })}
      </EditorCard>
    </EditorPanel>
  );
};
