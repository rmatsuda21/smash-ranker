import { Trans } from "@lingui/react/macro";

import { useResultsStore } from "@/store/resultsStore";
import type { PlayerSet } from "@/types/results/PlayerTournamentResults";
import { lookupFallbackCharacterId } from "@/utils/results/fallbackCharacters";

import { SetListDisplaySettings } from "../SetListDisplaySettings/SetListDisplaySettings";
import { SetRow } from "./SetRow";
import styles from "./SetList.module.scss";

type PhaseGroup = {
  id: string;
  name: string;
  sets: PlayerSet[];
};

// Groups consecutive sets by phaseId. Input is assumed already sorted by
// (phaseOrder, startAt) so a single linear pass suffices.
const groupByPhase = (sets: PlayerSet[]): PhaseGroup[] => {
  const groups: PhaseGroup[] = [];
  for (const s of sets) {
    const last = groups[groups.length - 1];
    if (last && last.id === s.phaseId) {
      last.sets.push(s);
    } else {
      groups.push({ id: s.phaseId, name: s.phaseName, sets: [s] });
    }
  }
  return groups;
};

export const SetList = () => {
  const playerResults = useResultsStore((s) => s.playerResults);
  const fallbackCharacters = useResultsStore((s) => s.fallbackCharacters);
  const layout = useResultsStore((s) => s.setListLayout);
  const variant = useResultsStore((s) => s.setListStyle);

  if (!playerResults) return null;

  if (playerResults.sets.length === 0) {
    return (
      <p className={styles.empty}>
        <Trans>No completed sets found for this player.</Trans>
      </p>
    );
  }

  // See utils/results/fallbackCharacters.ts: undefined = still fetching
  // (shimmer), null = fetched-but-empty (dashed placeholder), string = id.
  const selfFallback = lookupFallbackCharacterId(
    fallbackCharacters,
    playerResults.entrantId,
  );
  const phaseGroups = groupByPhase(playerResults.sets);
  const self = {
    name: playerResults.prefix
      ? `${playerResults.prefix} | ${playerResults.name}`
      : playerResults.name,
    seed: playerResults.seed,
    placement: playerResults.placement,
  };

  return (
    <div
      className={styles.root}
      data-has-upsets={
        playerResults.sets.some((s) => (s.upsetFactor ?? 0) > 0) || undefined
      }
    >
      <div className={styles.titleRow}>
        <h3 className={styles.title}>
          <Trans>Sets</Trans>
          <span className={styles.count}>{playerResults.sets.length}</span>
        </h3>
        <SetListDisplaySettings />
      </div>
      <div className={styles.phases}>
        {phaseGroups.map((group) => (
          <section key={group.id} className={styles.phase}>
            <h4 className={styles.phaseHeader}>
              <span className={styles.phaseName}>{group.name}</span>
              <span className={styles.phaseCount}>{group.sets.length}</span>
              <span className={styles.phaseRecord}>
                {group.sets.filter((s) => s.didWin).length}–
                {group.sets.filter((s) => !s.didWin).length}
              </span>
            </h4>
            <div className={styles.list}>
              {group.sets.map((set) => (
                <SetRow
                  key={set.id}
                  set={set}
                  self={self}
                  selfFallbackCharacterId={selfFallback}
                  opponentFallbackCharacterId={lookupFallbackCharacterId(
                    fallbackCharacters,
                    set.opponent.id,
                  )}
                  variant={layout === "path" ? "default" : variant}
                  layout={layout}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
