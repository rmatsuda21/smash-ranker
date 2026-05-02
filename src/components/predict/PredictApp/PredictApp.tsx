import { useEffect, useRef, useState } from "react";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { FaListOl } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { Modal } from "@/components/shared/Modal/Modal";
import { useConfirmation } from "@/hooks/useConfirmation";
import { usePredictionStore } from "@/store/predictionStore";
import { useFetchPredictionEntrants } from "@/hooks/predict/useFetchPredictionEntrants";
import { detectPlatformAndSlug, slugToUrl, type Platform } from "@/consts/platforms";
import { TournamentUrlInput } from "@/components/predict/TournamentUrlInput/TournamentUrlInput";
import { InviteShareButton } from "@/components/predict/InviteShareButton/InviteShareButton";
import { PredictionCountSelector } from "@/components/predict/PredictionCountSelector/PredictionCountSelector";
import { PredictionWorkspace } from "@/components/predict/PredictionWorkspace/PredictionWorkspace";
import { ActionBar } from "@/components/predict/ActionBar/ActionBar";
import {
  PredictionPreview,
  type PredictionPreviewCache,
} from "@/components/predict/PredictionPreview/PredictionPreview";

import styles from "./PredictApp.module.scss";

const isPlatform = (value: string | null): value is Platform =>
  value === "startgg" || value === "challonge" || value === "tonamel";

export const PredictApp = () => {
  const { _ } = useLingui();
  const entrantPool = usePredictionStore((s) => s.entrantPool);
  const predictions = usePredictionStore((s) => s.predictions);
  const tournamentName = usePredictionStore((s) => s.tournamentName);
  const tournamentUrl = usePredictionStore((s) => s.tournamentUrl);
  const eventName = usePredictionStore((s) => s.eventName);
  const error = usePredictionStore((s) => s.error);
  const fetching = usePredictionStore((s) => s.fetching);
  const dispatch = usePredictionStore((s) => s.dispatch);
  const { fetchEntrants } = useFetchPredictionEntrants();

  const [previewOpen, setPreviewOpen] = useState(false);
  const previewCacheRef = useRef<PredictionPreviewCache | null>(null);

  const didAutoLoadRef = useRef(false);
  useEffect(() => {
    if (didAutoLoadRef.current) return;
    didAutoLoadRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const p = params.get("p");
    const s = params.get("s");
    if (!isPlatform(p) || !s) return;

    if (tournamentUrl && detectPlatformAndSlug(tournamentUrl)?.slug === s) return;

    fetchEntrants(slugToUrl(p, s));
  }, [fetchEntrants, tournamentUrl]);

  const { confirm: confirmClear, ConfirmationDialog: ClearConfirmation } =
    useConfirmation(() => dispatch({ type: "CLEAR_PREDICTIONS" }), {
      title: _(msg`Clear Predictions?`),
      description: _(msg`All current predictions will be removed.`),
    });

  const hasData = entrantPool.length > 0 || predictions.length > 0;

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
        <div className={styles.headerActions}>
          <InviteShareButton />
          <Button
            variant="ghost"
            size="sm"
            onClick={confirmClear}
          >
            <Trans>Clear</Trans>
          </Button>
        </div>
      </div>
      <ClearConfirmation />

      <PredictionCountSelector />
      <PredictionWorkspace />
      <ActionBar onGenerate={() => setPreviewOpen(true)} />

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)}>
        <PredictionPreview cacheRef={previewCacheRef} />
      </Modal>
    </div>
  );
};
