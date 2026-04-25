import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { usePredictionStore } from "@/store/predictionStore";
import type { PredictionCount } from "@/types/predict/Prediction";

import styles from "./PredictionCountSelector.module.scss";

export const PredictionCountSelector = () => {
  const { _ } = useLingui();
  const predictionCount = usePredictionStore((s) => s.predictionCount);
  const customCount = usePredictionStore((s) => s.customCount);
  const dispatch = usePredictionStore((s) => s.dispatch);

  const countOptions: { value: PredictionCount; label: string }[] = [
    { value: 8, label: _(msg`Top 8`) },
    { value: 16, label: _(msg`Top 16`) },
    { value: "custom", label: _(msg`Custom`) },
  ];

  return (
    <div className={styles.root}>
      <label className={styles.label}>
        <Trans>Prediction size</Trans>
      </label>
      <div className={styles.options}>
        {countOptions.map((opt) => (
          <Button
            key={String(opt.value)}
            variant={predictionCount === opt.value ? "solid" : "outline"}
            size="sm"
            className={cn(styles.optionButton, {
              [styles.active]: predictionCount === opt.value,
            })}
            onClick={() =>
              dispatch({ type: "SET_PREDICTION_COUNT", payload: opt.value })
            }
          >
            {opt.label}
          </Button>
        ))}
        <Input
          className={cn(styles.customInput, {
            [styles.customHidden]: predictionCount !== "custom",
          })}
          type="number"
          min={1}
          max={64}
          value={customCount}
          placeholder={_(msg`Count`)}
          onChange={(e) =>
            dispatch({
              type: "SET_CUSTOM_COUNT",
              payload: parseInt(e.currentTarget.value) || 1,
            })
          }
        />
      </div>
    </div>
  );
};
