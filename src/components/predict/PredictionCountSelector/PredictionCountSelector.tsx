import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Input } from "@/components/shared/Input/Input";
import {
  RadioGroup,
  type RadioGroupOption,
} from "@/components/shared/RadioGroup/RadioGroup";
import { usePredictionStore } from "@/store/predictionStore";
import type { PredictionCount } from "@/types/predict/Prediction";

import styles from "./PredictionCountSelector.module.scss";

type CountValue = "8" | "16" | "custom";

const toCount = (value: CountValue): PredictionCount =>
  value === "custom" ? "custom" : value === "8" ? 8 : 16;

export const PredictionCountSelector = () => {
  const { _ } = useLingui();
  const predictionCount = usePredictionStore((s) => s.predictionCount);
  const customCount = usePredictionStore((s) => s.customCount);
  const dispatch = usePredictionStore((s) => s.dispatch);

  const options: RadioGroupOption<CountValue>[] = [
    { value: "8", label: _(msg`Top 8`) },
    { value: "16", label: _(msg`Top 16`) },
    { value: "custom", label: _(msg`Custom`) },
  ];

  return (
    <div
      className={styles.root}
      role="group"
      aria-label={_(msg`Prediction size`)}
    >
      <RadioGroup
        options={options}
        value={String(predictionCount) as CountValue}
        onChange={(value) =>
          dispatch({ type: "SET_PREDICTION_COUNT", payload: toCount(value) })
        }
      />
      {predictionCount === "custom" && (
        <Input
          className={styles.customInput}
          type="number"
          inputMode="numeric"
          min={1}
          max={64}
          value={customCount}
          aria-label={_(msg`Count`)}
          onChange={(e) =>
            dispatch({
              type: "SET_CUSTOM_COUNT",
              payload: parseInt(e.currentTarget.value) || 1,
            })
          }
        />
      )}
    </div>
  );
};
