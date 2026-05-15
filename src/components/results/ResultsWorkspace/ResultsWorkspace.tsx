import { useEffect, useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { type MessageDescriptor } from "@lingui/core";

import { Button } from "@/components/shared/Button/Button";
import { FetchingState } from "@/components/shared/FetchingState/FetchingState";
import { EntrantPicker } from "@/components/results/EntrantPicker/EntrantPicker";
import { PlayerSummary } from "@/components/results/PlayerSummary/PlayerSummary";
import { SetList } from "@/components/results/SetList/SetList";
import { useResultsStore } from "@/store/resultsStore";
import type { PlayerTournamentResults } from "@/types/results/PlayerTournamentResults";

import styles from "./ResultsWorkspace.module.scss";

type MobileTab = "entrants" | "results";

type Props = {
  onSelectEntrant: (id: string) => void;
  onGenerate: () => void;
  fetchingResults: boolean;
  playerResults: PlayerTournamentResults | null;
  fallbacksReady: boolean;
  playerTaglines: MessageDescriptor[];
};

export const ResultsWorkspace = ({
  onSelectEntrant,
  onGenerate,
  fetchingResults,
  playerResults,
  fallbacksReady,
  playerTaglines,
}: Props) => {
  const [activeTab, setActiveTab] = useState<MobileTab>("entrants");
  const selectedEntrantId = useResultsStore((s) => s.selectedEntrantId);

  useEffect(() => {
    if (selectedEntrantId) setActiveTab("results");
  }, [selectedEntrantId]);

  const resultsTabDisabled = !selectedEntrantId && !fetchingResults;

  return (
    <div className={styles.root}>
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
            [styles.active]: activeTab === "results",
          })}
          onClick={() => setActiveTab("results")}
          disabled={resultsTabDisabled}
        >
          <Trans>Results</Trans>
        </button>
      </div>

      <div
        className={cn(styles.panel, styles.pickerPanel, {
          [styles.hiddenMobile]: activeTab !== "entrants",
        })}
      >
        <EntrantPicker onSelect={(entrant) => onSelectEntrant(entrant.id)} />
      </div>
      <div
        className={cn(styles.panel, styles.resultsPanel, {
          [styles.hiddenMobile]: activeTab !== "results",
        })}
      >
        {fetchingResults && !playerResults && (
          <FetchingState
            mode="inline"
            heading={<Trans>Loading results</Trans>}
            taglines={playerTaglines}
          />
        )}
        {playerResults && (
          <>
            <PlayerSummary />
            <SetList />
            <div className={styles.generateBar}>
              <Button
                onClick={onGenerate}
                loading={fetchingResults || !fallbacksReady}
                loadingText={<Trans>Fetching opponent data...</Trans>}
              >
                <Trans>Generate Graphic</Trans>
              </Button>
            </div>
          </>
        )}
        {!fetchingResults && !playerResults && (
          <div className={styles.placeholder}>
            <Trans>Pick a player to see their results.</Trans>
          </div>
        )}
      </div>
    </div>
  );
};
