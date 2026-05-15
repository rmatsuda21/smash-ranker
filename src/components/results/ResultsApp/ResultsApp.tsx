import { useEffect, useMemo, useRef, useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { type MessageDescriptor } from "@lingui/core";
import { FaChartLine } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { Modal } from "@/components/shared/Modal/Modal";
import { TournamentUrlInput } from "@/components/shared/TournamentUrlInput/TournamentUrlInput";
import { FetchingState } from "@/components/shared/FetchingState/FetchingState";
import { useResultsStore } from "@/store/resultsStore";
import { useFetchResultsEntrantPool } from "@/hooks/results/useFetchResultsEntrantPool";
import { useFetchPlayerResults } from "@/hooks/results/useFetchPlayerResults";
import { useFetchPlayerFallbackCharacter } from "@/hooks/results/useFetchPlayerFallbackCharacter";
import { ResultsWorkspace } from "@/components/results/ResultsWorkspace/ResultsWorkspace";
import {
  ResultsPreview,
  type ResultsPreviewCache,
} from "@/components/results/ResultsPreview/ResultsPreview";
import {
  allFallbacksLoaded,
  getEntrantsNeedingFallback,
  hasFallbackEntry,
} from "@/utils/results/fallbackCharacters";
import { logEvent } from "@/utils/observability/log";

import styles from "./ResultsApp.module.scss";

const POOL_TAGLINES: MessageDescriptor[] = [
  msg`Talking to the bracket gods...`,
  msg`Pulling entrants...`,
  msg`Rounding up the squad...`,
  msg`Reading the bracket...`,
];

const PLAYER_TAGLINES: MessageDescriptor[] = [
  msg`Replaying the bracket...`,
  msg`Counting stocks...`,
  msg`Tallying the damage...`,
  msg`Recapping the run...`,
];

export const ResultsApp = () => {
  const tournamentName = useResultsStore((s) => s.tournamentName);
  const eventName = useResultsStore((s) => s.eventName);
  const entrantPool = useResultsStore((s) => s.entrantPool);
  const error = useResultsStore((s) => s.error);
  const fetchingPool = useResultsStore((s) => s.fetchingPool);
  const fetchingResults = useResultsStore((s) => s.fetchingResults);
  const playerResults = useResultsStore((s) => s.playerResults);
  const dispatch = useResultsStore((s) => s.dispatch);

  const { fetchEntrants } = useFetchResultsEntrantPool();
  const { fetchPlayerResults } = useFetchPlayerResults();
  const { fetchFallback } = useFetchPlayerFallbackCharacter();
  const videogameId = useResultsStore((s) => s.videogameId);
  const fallbackCharacters = useResultsStore((s) => s.fallbackCharacters);
  const { _ } = useLingui();

  const [previewOpen, setPreviewOpen] = useState(false);
  const previewCacheRef = useRef<ResultsPreviewCache | null>(null);

  // Auto-fetch results when a persisted entrant is selected without results yet
  // (e.g. on first load after refresh). Triggered once per selection change.
  const lastFetchedRef = useRef<string | null>(null);
  const selectedEntrantId = useResultsStore((s) => s.selectedEntrantId);
  useEffect(() => {
    if (!selectedEntrantId) return;
    if (playerResults?.entrantId === selectedEntrantId) {
      lastFetchedRef.current = selectedEntrantId;
      return;
    }
    if (lastFetchedRef.current === selectedEntrantId) return;
    if (fetchingResults) return;
    lastFetchedRef.current = selectedEntrantId;
    fetchPlayerResults(selectedEntrantId);
  }, [selectedEntrantId, playerResults, fetchingResults, fetchPlayerResults]);

  // Fan out fallback-character fetches only for entrants whose fallback
  // would actually be rendered — i.e. those with at least one set where
  // their side's character list is empty. When every set has recorded
  // selections, no network call fires and the gate below is satisfied
  // immediately.
  useEffect(() => {
    if (!videogameId || !playerResults) return;
    const needs = getEntrantsNeedingFallback(playerResults);
    if (needs.size === 0) return;
    const playerIdByEntrant = new Map<string, string | undefined>();
    playerIdByEntrant.set(playerResults.entrantId, playerResults.playerId);
    for (const set of playerResults.sets) {
      if (!set.opponent.id || playerIdByEntrant.has(set.opponent.id)) continue;
      playerIdByEntrant.set(set.opponent.id, set.opponent.playerId);
    }
    for (const entrantId of needs) {
      if (hasFallbackEntry(fallbackCharacters, entrantId)) continue;
      fetchFallback(entrantId, videogameId, playerIdByEntrant.get(entrantId));
    }
  }, [playerResults, videogameId, fallbackCharacters, fetchFallback]);

  // Gate the Generate button until every entrant we care about has a
  // resolved fallback entry — otherwise the rendered PNG would miss
  // grayscale icons for opponents whose lookup hasn't finished.
  const fallbacksReady = useMemo(
    () => allFallbacksLoaded(playerResults, fallbackCharacters, videogameId),
    [playerResults, fallbackCharacters, videogameId],
  );

  const handleSelect = (id: string) => {
    dispatch({ type: "SELECT_ENTRANT", payload: id });
    lastFetchedRef.current = id;
    fetchPlayerResults(id);
  };

  const handleGenerate = () => {
    if (!playerResults) return;
    setPreviewOpen(true);
    // Single `_start` event per export attempt — fired here at the
    // intent moment (modal open) and paired with the `_complete`/`_fail`
    // events emitted by ResultsPreview / ResultsExportBar. Carries the
    // start.gg identifiers so the funnel breakdown can isolate problem
    // tournaments/players.
    logEvent("graphic_export_start", {
      export_surface: "results",
      export_format: "png",
      set_count: playerResults.sets.length,
      tournament_url: useResultsStore.getState().tournamentUrl,
      videogame_id: videogameId,
      entrant_id: playerResults.entrantId,
      player_id: playerResults.playerId ?? null,
    });
  };

  const hasData = entrantPool.length > 0;

  if (!hasData) {
    return (
      <div className={styles.root}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FaChartLine />
          </div>
          <h2 className={styles.emptyTitle}>
            <Trans>Tournament Recap</Trans>
          </h2>
          <p className={styles.emptyDescription}>
            <Trans>
              Paste a start.gg event URL, pick a player, and generate a
              shareable recap of their run.
            </Trans>
          </p>
          <div className={styles.emptyInput}>
            <TournamentUrlInput
              onLoad={fetchEntrants}
              isFetching={fetchingPool}
              inputId="results-tournament-url"
              placeholder={_(msg`https://start.gg/tournament/.../event/...`)}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {fetchingPool && (
            <div className={styles.emptyFetching}>
              <FetchingState
                mode="inline"
                heading={<Trans>Loading tournament</Trans>}
                taglines={POOL_TAGLINES}
              />
            </div>
          )}
          <div className={styles.supportedPlatforms}>
            <span>
              <Trans>start.gg only</Trans>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <TournamentUrlInput
        onLoad={fetchEntrants}
        isFetching={fetchingPool}
        inputId="results-tournament-url"
      />

      {error && <p className={styles.error}>{error}</p>}

      <div
        className={cn(
          styles.workspace,
          fetchingPool && styles.workspaceFetching,
        )}
        aria-busy={fetchingPool}
      >
        <div className={styles.tournamentHeader}>
          <div className={styles.tournamentInfo}>
            <h2 className={styles.tournamentName}>{tournamentName}</h2>
            {eventName && <p className={styles.eventName}>{eventName}</p>}
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: "RESET" })}
            >
              <Trans>Clear</Trans>
            </Button>
          </div>
        </div>

        <ResultsWorkspace
          onSelectEntrant={handleSelect}
          onGenerate={handleGenerate}
          fetchingResults={fetchingResults}
          playerResults={playerResults}
          fallbacksReady={fallbacksReady}
          playerTaglines={PLAYER_TAGLINES}
        />

        {fetchingPool && (
          <FetchingState
            mode="overlay"
            heading={<Trans>Loading tournament</Trans>}
            taglines={POOL_TAGLINES}
          />
        )}
      </div>

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)}>
        <ResultsPreview cacheRef={previewCacheRef} />
      </Modal>
    </div>
  );
};
