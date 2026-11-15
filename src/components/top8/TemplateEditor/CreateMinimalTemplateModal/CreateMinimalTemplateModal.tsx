import { useEffect, useId, useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Modal } from "@/components/shared/Modal/Modal";
import { Button } from "@/components/shared/Button/Button";
import {
  RadioGroup,
  type RadioGroupOption,
} from "@/components/shared/RadioGroup/RadioGroup";
import { Field, FieldGroup } from "@/components/top8/EditorForm/EditorForm";
import type { MinimalTheme } from "@/designs/minimal";

import styles from "./CreateMinimalTemplateModal.module.scss";

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 32;
const PLAYER_COUNT_PRESETS = [4, 8, 16, 32];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  createTemplate: (
    name: string,
    playerCount: number,
    theme: MinimalTheme,
  ) => void;
};

export const CreateMinimalTemplateModal = ({
  isOpen,
  onClose,
  createTemplate,
}: Props) => {
  const { _ } = useLingui();
  const titleId = useId();
  const countId = useId();
  const nameId = useId();
  // Kept as typed, so the field can be cleared and retyped.
  const [countText, setCountText] = useState("8");
  const [theme, setTheme] = useState<MinimalTheme>("dark");
  // Null until the user types a name of their own.
  const [customName, setCustomName] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCountText("8");
    setTheme("dark");
    setCustomName(null);
  }, [isOpen]);

  const themeOptions: RadioGroupOption<MinimalTheme>[] = [
    { value: "dark", label: _(msg`Dark`) },
    { value: "light", label: _(msg`Light`) },
  ];

  const parsedCount = /^\d+$/.test(countText) ? Number(countText) : NaN;
  const isCountValid = parsedCount >= MIN_PLAYERS && parsedCount <= MAX_PLAYERS;
  // The sketch and the suggested name follow the last valid count.
  const playerCount = isCountValid
    ? parsedCount
    : Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, parsedCount || 8));

  const suggestedName =
    theme === "dark"
      ? _(msg`${playerCount} Players (Dark)`)
      : _(msg`${playerCount} Players (Light)`);
  const templateName = customName ?? suggestedName;
  const name = templateName.trim();
  const canCreate = isCountValid && name !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    createTemplate(name, parsedCount, theme);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-labelledby={titleId}>
      <form
        className={styles.createMinimalTemplateModal}
        onSubmit={handleSubmit}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            <Trans>Custom Minimal Template</Trans>
          </h2>
          <p className={styles.description}>
            <Trans>
              Create a minimal template with a specific player count.
            </Trans>
          </p>
        </header>

        <div className={styles.body}>
          {/* A sketch of the result: a header and one row per player. */}
          <div className={cn(styles.sketch, styles[theme])} aria-hidden="true">
            <span className={styles.sketchHeader} />
            {Array.from({ length: playerCount }, (_, i) => (
              <span key={i} className={styles.sketchRow} />
            ))}
          </div>

          <div className={styles.fields}>
            <FieldGroup label={<Trans>Theme</Trans>}>
              <RadioGroup
                className={styles.theme}
                options={themeOptions}
                value={theme}
                onChange={setTheme}
              />
            </FieldGroup>

            <div className={styles.count}>
              <Field
                id={countId}
                label={_(msg`Player Count`)}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={!isCountValid}
                value={countText}
                onChange={(e) =>
                  setCountText(e.target.value.replace(/\D/g, "").slice(0, 2))
                }
              />
              <div className={styles.presets}>
                {PLAYER_COUNT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={cn(styles.preset, {
                      [styles.active]: parsedCount === preset,
                    })}
                    onClick={() => setCountText(String(preset))}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              {!isCountValid && (
                <p className={styles.error} role="alert">
                  <Trans>
                    Enter a number from {MIN_PLAYERS} to {MAX_PLAYERS}.
                  </Trans>
                </p>
              )}
            </div>
          </div>
        </div>

        <Field
          id={nameId}
          label={_(msg`Template Name`)}
          type="text"
          placeholder={suggestedName}
          value={templateName}
          maxLength={60}
          autoComplete="off"
          onChange={(e) => setCustomName(e.target.value)}
        />

        <footer className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            <Trans>Cancel</Trans>
          </Button>
          <Button type="submit" disabled={!canCreate}>
            <Trans>Create Template</Trans>
          </Button>
        </footer>
      </form>
    </Modal>
  );
};
