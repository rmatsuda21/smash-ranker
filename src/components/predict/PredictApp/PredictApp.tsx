import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { MdArrowBack } from "react-icons/md";
import { FaListOl } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { useConfirmation } from "@/hooks/useConfirmation";
import { usePredictionStore } from "@/store/predictionStore";
import { TournamentUrlInput } from "@/components/predict/TournamentUrlInput/TournamentUrlInput";
import { PredictionCountSelector } from "@/components/predict/PredictionCountSelector/PredictionCountSelector";
import { PredictionWorkspace } from "@/components/predict/PredictionWorkspace/PredictionWorkspace";
import { ActionBar } from "@/components/predict/ActionBar/ActionBar";
import { PredictionGraphic } from "@/components/predict/PredictionGraphic/PredictionGraphic";
import { ExportBar } from "@/components/predict/ExportBar/ExportBar";

import styles from "./PredictApp.module.scss";

export const PredictApp = () => {
  const { _ } = useLingui();
  const phase = usePredictionStore((s) => s.phase);
  const entrantPool = usePredictionStore((s) => s.entrantPool);
  const predictions = usePredictionStore((s) => s.predictions);
  const tournamentName = usePredictionStore((s) => s.tournamentName);
  const eventName = usePredictionStore((s) => s.eventName);
  const error = usePredictionStore((s) => s.error);
  const fetching = usePredictionStore((s) => s.fetching);
  const dispatch = usePredictionStore((s) => s.dispatch);

  const { confirm: confirmClear, ConfirmationDialog: ClearConfirmation } =
    useConfirmation(() => dispatch({ type: "CLEAR_PREDICTIONS" }), {
      title: _(msg`Clear Predictions?`),
      description: _(msg`All current predictions will be removed.`),
    });

  const hasData = entrantPool.length > 0 || predictions.length > 0;

  if (phase === "preview") {
    return (
      <div className={`${styles.root} ${styles.previewRoot}`}>
        <div className={styles.previewHeader}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "SET_PHASE", payload: "input" })}
          >
            <MdArrowBack />
            <Trans>Back to Edit</Trans>
          </Button>
        </div>
        <PredictionGraphic />
        <ExportBar />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={styles.root}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FaListOl />
          </div>
          <h2 className={styles.emptyTitle}>
            <Trans>Predictions</Trans>
          </h2>
          <p className={styles.emptyDescription}>
            <Trans>
              Paste a tournament URL to predict placements and share your picks.
            </Trans>
          </p>
          <div className={styles.emptyInput}>
            <TournamentUrlInput />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {fetching && (
            <p className={styles.loadingHint}>
              <Trans>Loading entrants...</Trans>
            </p>
          )}
          <div className={styles.supportedPlatforms}>
            <span>start.gg</span>
            <span className={styles.dot} />
            <span>Challonge</span>
            <span className={styles.dot} />
            <span>Tonamel</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <TournamentUrlInput />

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.tournamentHeader}>
        <div className={styles.tournamentInfo}>
          <h2 className={styles.tournamentName}>{tournamentName}</h2>
          {eventName && <p className={styles.eventName}>{eventName}</p>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={confirmClear}
        >
          <Trans>Clear</Trans>
        </Button>
      </div>
      <ClearConfirmation />

      <PredictionCountSelector />
      <PredictionWorkspace />
      <ActionBar />
    </div>
  );
};
