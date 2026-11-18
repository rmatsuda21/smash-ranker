import { useEffect, useId, useState } from "react";
import cn from "classnames";
import { FaMinus, FaPlus } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";

import styles from "./PlayersEditor.module.scss";

const PRESETS = [4, 8, 16, 32];

type Props = {
  count: number;
  min: number;
  max: number;
  onChange: (count: number) => void;
};

// How many players the graphic shows: step by one, type a number, or jump to
// a common bracket size.
export const PlayerCountControl = ({ count, min, max, onChange }: Props) => {
  const { _ } = useLingui();
  const inputId = useId();
  // Kept as typed, so the field can be cleared and retyped. Applied on
  // Enter or when the field loses focus.
  const [text, setText] = useState(String(count));

  useEffect(() => {
    setText(String(count));
  }, [count]);

  const commit = () => {
    const parsed = Number(text);
    if (text === "" || !Number.isFinite(parsed)) {
      setText(String(count));
      return;
    }
    const next = Math.max(min, Math.min(max, parsed));
    setText(String(next));
    if (next !== count) onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "ArrowUp" && count < max) {
      e.preventDefault();
      onChange(count + 1);
    } else if (e.key === "ArrowDown" && count > min) {
      e.preventDefault();
      onChange(count - 1);
    } else if (e.key === "Escape") {
      setText(String(count));
    }
  };

  const presets = PRESETS.filter((preset) => preset >= min && preset <= max);

  return (
    <div className={styles.playerCount}>
      <label className={styles.playerCountLabel} htmlFor={inputId}>
        <Trans>Player Count</Trans>
      </label>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepperButton}
          onClick={() => onChange(count - 1)}
          disabled={count <= min}
          aria-label={_(msg`Remove last player`)}
          title={_(msg`Remove last player`)}
        >
          <FaMinus size={10} />
        </button>
        <input
          id={inputId}
          className={styles.stepperInput}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={text}
          onChange={(e) =>
            setText(e.target.value.replace(/\D/g, "").slice(0, 2))
          }
          // The whole number stays selected (a click would otherwise drop
          // the selection made on focus), so typing replaces it.
          onFocus={(e) => e.target.select()}
          onClick={(e) => e.currentTarget.select()}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={styles.stepperButton}
          onClick={() => onChange(count + 1)}
          disabled={count >= max}
          aria-label={_(msg`Add player`)}
          title={_(msg`Add player`)}
        >
          <FaPlus size={10} />
        </button>
      </div>
      <div
        className={styles.countPresets}
        role="group"
        aria-label={_(msg`Common player counts`)}
      >
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={cn(styles.countPreset, {
              [styles.active]: count === preset,
            })}
            aria-pressed={count === preset}
            onClick={() => onChange(preset)}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
};
