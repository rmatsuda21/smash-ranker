import { Trans } from "@lingui/react/macro";

import { Button } from "@/components/shared/Button/Button";
import { usePredictionStore } from "@/store/predictionStore";

import styles from "./ActionBar.module.scss";

type Props = {
  onGenerate: () => void;
};

export const ActionBar = ({ onGenerate }: Props) => {
  const predictions = usePredictionStore((s) => s.predictions);
  const predictionCount = usePredictionStore((s) => s.predictionCount);
  const customCount = usePredictionStore((s) => s.customCount);
  const entrantPool = usePredictionStore((s) => s.entrantPool);
  const dispatch = usePredictionStore((s) => s.dispatch);

  const effectiveCount =
    predictionCount === "custom" ? customCount : predictionCount;
  const isFull = predictions.length >= effectiveCount;
  const canAutoFill = entrantPool.length > 0 && !isFull;

  return (
    <div className={styles.root}>
      <Button
        variant="outline"
        disabled={!canAutoFill}
        onClick={() => dispatch({ type: "AUTO_FILL" })}
      >
        <Trans>Auto-fill by seed</Trans>
      </Button>
      <Button disabled={!isFull} onClick={onGenerate}>
        <Trans>Generate Graphic</Trans>
      </Button>
    </div>
  );
};
