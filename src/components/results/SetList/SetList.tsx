import { Trans } from "@lingui/react/macro";

import { useResultsStore } from "@/store/resultsStore";
import type { PlayerSet } from "@/types/results/PlayerTournamentResults";

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

  if (!playerResults) return null;

  if (playerResults.sets.length === 0) {
    return (
      <p className={styles.empty}>
        <Trans>No completed sets found for this player.</Trans>
      </p>
    );
  }

  // `undefined` = fallback fetch not yet completed (show shimmer);
  // `null` = fetched, no recorded character usage (show empty placeholder);
  // `string` = use as the grayscale fallback icon.
  const lookupFallback = (id: string): string | null | undefined =>
    Object.prototype.hasOwnProperty.call(fallbackCharacters, id)
      ? fallbackCharacters[id]
      : undefined;

  const selfFallback = lookupFallback(playerResults.entrantId);
  const phaseGroups = groupByPhase(playerResults.sets);

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>
        <Trans>Sets</Trans>
        <span className={styles.count}>({playerResults.sets.length})</span>
      </h3>
      <div className={styles.phases}>
        {phaseGroups.map((group) => (
          <section key={group.id} className={styles.phase}>
            <h4 className={styles.phaseHeader}>
              <span className={styles.phaseName}>{group.name}</span>
              <span className={styles.phaseCount}>({group.sets.length})</span>
            </h4>
            <div className={styles.list}>
              {group.sets.map((set) => (
                <SetRow
                  key={set.id}
                  set={set}
                  selfFallbackCharacterId={selfFallback}
                  opponentFallbackCharacterId={lookupFallback(set.opponent.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
