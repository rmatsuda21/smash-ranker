import { useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";

import { usePredictionStore } from "@/store/predictionStore";
import { EntrantPoolPanel } from "@/components/predict/EntrantPoolPanel/EntrantPoolPanel";
import { PredictionListPanel } from "@/components/predict/PredictionListPanel/PredictionListPanel";

import styles from "./PredictionWorkspace.module.scss";

type MobileTab = "entrants" | "predictions";

export const PredictionWorkspace = () => {
  const [activeTab, setActiveTab] = useState<MobileTab>("entrants");
  const predictions = usePredictionStore((s) => s.predictions);
  const predictionCount = usePredictionStore((s) => s.predictionCount);
  const customCount = usePredictionStore((s) => s.customCount);
  const effectiveCount =
    predictionCount === "custom" ? customCount : predictionCount;

  return (
    <div className={styles.root}>
      {/* Mobile tabs */}
      <div className={styles.tabs}>
        <button
          className={cn(styles.tab, {
            [styles.active]: activeTab === "entrants",
          })}
          onClick={() => setActiveTab("entrants")}
        >
          <Trans>Entrants</Trans>
        </button>
        <button
          className={cn(styles.tab, {
            [styles.active]: activeTab === "predictions",
          })}
          onClick={() => setActiveTab("predictions")}
        >
          <Trans>Predictions</Trans>
          <span className={styles.tabBadge}>
            {predictions.length}/{effectiveCount}
          </span>
        </button>
      </div>

      {/* Desktop: side by side. Mobile: only active tab shown */}
      <div
        className={cn(styles.panel, {
          [styles.hiddenMobile]: activeTab !== "entrants",
        })}
      >
        <EntrantPoolPanel />
      </div>
      <div
        className={cn(styles.panel, {
          [styles.hiddenMobile]: activeTab !== "predictions",
        })}
      >
        <PredictionListPanel />
      </div>
    </div>
  );
};
