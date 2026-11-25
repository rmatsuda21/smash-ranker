import { Trans } from "@lingui/react/macro";

import {
  CharacterIcons,
  EntrantName,
  SeedDelta,
  SkeletonRows,
} from "@/components/tournament/TournamentParts/TournamentParts";
import { useEventStandings } from "@/hooks/tournament/useEventStandings";
import type { TournamentEvent } from "@/types/tournament/Tournament";

import styles from "./StandingsTab.module.scss";

type Props = {
  event: TournamentEvent;
  // Characters of the entrants seen in the top 8's sets; the rest have none.
  characters: Record<string, string[]>;
};

// Every placement of the event, a page at a time.
export const StandingsTab = ({ event, characters }: Props) => {
  const { standings, total, status, hasMore, loadMore } = useEventStandings(
    event.id,
  );

  if (status === "error" && standings.length === 0) {
    return (
      <p className={styles.message}>
        <Trans>This didn't load. Reload to try again.</Trans>
      </p>
    );
  }
  if (status === "done" && standings.length === 0) {
    return (
      <p className={styles.message}>
        <Trans>No placements yet.</Trans>
      </p>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.head} aria-hidden="true">
        <span className={styles.place}>#</span>
        <span className={styles.name}>
          <Trans>Entrant</Trans>
        </span>
        <span className={styles.seed}>
          <Trans>Seed</Trans>
        </span>
        <span className={styles.delta}>+/−</span>
      </div>
      <ol className={styles.rows}>
        {standings.map((entry) => (
          <li key={entry.entrantId} className={styles.row}>
            <span className={styles.place}>{entry.placement}</span>
            <span className={styles.name}>
              <CharacterIcons
                characters={characters[entry.entrantId]}
                event={event}
                size={20}
              />
              <span>
                <EntrantName prefix={entry.prefix} tag={entry.tag} />
              </span>
            </span>
            <span className={styles.seed}>{entry.seed ?? "–"}</span>
            <SeedDelta seed={entry.seed} placement={entry.placement} />
          </li>
        ))}
      </ol>
      {standings.length === 0 && <SkeletonRows count={12} />}
      {hasMore && (
        <button
          type="button"
          className={styles.more}
          disabled={status === "loading"}
          onClick={loadMore}
        >
          {status === "loading" ? (
            <Trans>Loading…</Trans>
          ) : (
            <Trans>
              Show more ({standings.length} of {total})
            </Trans>
          )}
        </button>
      )}
    </div>
  );
};
