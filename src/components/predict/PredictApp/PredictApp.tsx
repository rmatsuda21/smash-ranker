import { useEffect, useMemo, useRef, useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { type MessageDescriptor } from "@lingui/core";
import { FaListOl } from "react-icons/fa6";

import { Modal } from "@/components/shared/Modal/Modal";
import { TournamentUrlInput } from "@/components/shared/TournamentUrlInput/TournamentUrlInput";
import { TournamentIdentity } from "@/components/shared/TournamentIdentity/TournamentIdentity";
import { FetchingState } from "@/components/shared/FetchingState/FetchingState";
import { usePredictionStore } from "@/store/predictionStore";
import { useFetchPredictionEntrants } from "@/hooks/predict/useFetchPredictionEntrants";
import { detectPlatformAndSlug, slugToUrl } from "@/consts/platforms";
import { decodeInvite } from "@/utils/predict/inviteCode";
import { InviteShareButton } from "@/components/predict/InviteShareButton/InviteShareButton";
import { PredictionWorkspace } from "@/components/predict/PredictionWorkspace/PredictionWorkspace";
import {
  PredictionPreview,
  type PredictionPreviewCache,
} from "@/components/predict/PredictionPreview/PredictionPreview";

import styles from "./PredictApp.module.scss";

const PREDICT_TAGLINES: MessageDescriptor[] = [
  msg`Talking to the bracket gods...`,
  msg`Pulling entrants...`,
  msg`Sharpening the seeds...`,
  msg`Hyping up the bracket...`,
  msg`Rounding up the squad...`,
  msg`Counting the contenders...`,
];

export const PredictApp = () => {
  const { _, i18n } = useLingui();
  const entrantPool = usePredictionStore((s) => s.entrantPool);
  const predictions = usePredictionStore((s) => s.predictions);
  const tournamentName = usePredictionStore((s) => s.tournamentName);
  const tournamentUrl = usePredictionStore((s) => s.tournamentUrl);
  const tournamentIconUrl = usePredictionStore((s) => s.tournamentIconUrl);
  const tournamentId = usePredictionStore((s) => s.tournamentId);
  const tournamentDate = usePredictionStore((s) => s.tournamentDate);
  const eventName = usePredictionStore((s) => s.eventName);
  const error = usePredictionStore((s) => s.error);
  const fetching = usePredictionStore((s) => s.fetching);
  const { fetchEntrants } = useFetchPredictionEntrants();

  const [previewOpen, setPreviewOpen] = useState(false);
  const previewCacheRef = useRef<PredictionPreviewCache | null>(null);

  const didAutoLoadRef = useRef(false);
  useEffect(() => {
    if (didAutoLoadRef.current) return;
    didAutoLoadRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const decoded = decodeInvite(params.get("d"));
    if (!decoded) return;

    if (
      tournamentUrl &&
      detectPlatformAndSlug(tournamentUrl)?.slug === decoded.slug
    )
      return;

    fetchEntrants(slugToUrl(decoded.platform, decoded.slug));
  }, [fetchEntrants, tournamentUrl]);

  const formattedDate = useMemo(() => {
    if (!tournamentDate) return "";
    const date = new Date(tournamentDate);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(i18n.locale, { dateStyle: "medium" }).format(
      date,
    );
  }, [tournamentDate, i18n.locale]);
  const tournamentMeta = [eventName, formattedDate].filter(Boolean).join(" · ");

  // On a phone the field shares the toolbar row with the tournament until it
  // is focused, and only has room for a couple of words.
  const isNarrow = window.matchMedia("(max-width: 768px)").matches;

  const hasData = entrantPool.length > 0 || predictions.length > 0;

  if (!hasData) {
    return (
      <div className={cn(styles.root, styles.landing)}>
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
            <TournamentUrlInput
              onLoad={fetchEntrants}
              isFetching={fetching}
              inputId="predict-tournament-url"
              variant="pill"
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {fetching && (
            <div className={styles.emptyFetching}>
              <FetchingState
                mode="inline"
                heading={<Trans>Loading tournament</Trans>}
                taglines={PREDICT_TAGLINES}
              />
            </div>
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
      <header className={styles.header}>
        <TournamentIdentity
          className={styles.tournamentInfo}
          href={tournamentUrl}
          tournamentId={tournamentId}
          iconUrl={tournamentIconUrl}
          name={tournamentName}
          meta={tournamentMeta}
        />
        <TournamentUrlInput
          className={styles.urlInput}
          onLoad={fetchEntrants}
          isFetching={fetching}
          inputId="predict-tournament-url"
          variant="pill"
          placeholder={isNarrow ? _(msg`Paste URL`) : undefined}
        />
        <InviteShareButton className={styles.invite} />
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <div
        className={cn(styles.workspace, fetching && styles.workspaceFetching)}
        aria-busy={fetching}
      >
        <PredictionWorkspace onGenerate={() => setPreviewOpen(true)} />

        {fetching && (
          <FetchingState
            mode="overlay"
            heading={<Trans>Loading tournament</Trans>}
            taglines={PREDICT_TAGLINES}
          />
        )}
      </div>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        aria-label={_(msg`Preview`)}
      >
        <PredictionPreview cacheRef={previewCacheRef} />
      </Modal>
    </div>
  );
};
