import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";

import { CharacterIcons } from "@/components/tournament/TournamentParts/TournamentParts";
import type { EventSet, TournamentEvent } from "@/types/tournament/Tournament";

import styles from "./MatchBox.module.scss";

type Props = {
  set: EventSet;
  event: TournamentEvent;
  // Characters by entrant id, for the entrants that have any.
  characters: Record<string, string[]>;
  className?: string;
  style?: React.CSSProperties;
};

// One set as a two-row box: both players in the order of the set's slots,
// the winner in bold with their score on the accent. 224 by 64 pixels, the
// size the bracket's grid is built on.
export const MatchBox = ({
  set,
  event,
  characters,
  className,
  style,
}: Props) => {
  const sides =
    set.winnerSlot === 0 ? [set.winner, set.loser] : [set.loser, set.winner];
  // The seed column fits the event's largest seed, so every box of the event
  // puts its names at the same place whatever its own seeds are.
  const seedDigits = Math.max(String(event.numEntrants).length, 2);

  return (
    <article
      className={cn(styles.match, className)}
      style={{ ...style, "--seed-digits": seedDigits } as React.CSSProperties}
    >
      {sides.map((player) => {
        const won = player === set.winner;
        return (
          <div
            key={player.entrantId}
            className={cn(styles.side, won && styles.won)}
          >
            <span className={styles.seed}>{player.seed ?? ""}</span>
            <CharacterIcons
              characters={characters[player.entrantId]}
              event={event}
              size={20}
            />
            <span className={styles.name}>{player.name}</span>
            <span className={styles.score}>
              {set.isDQ
                ? won
                  ? ""
                  : "DQ"
                : (player.score ?? (won ? "W" : "L"))}
            </span>
          </div>
        );
      })}
      {set.vodUrl && (
        <a
          className={styles.vod}
          href={set.vodUrl}
          target="_blank"
          rel="noreferrer"
        >
          <Trans>VOD</Trans>
          <FaArrowUpRightFromSquare aria-hidden="true" />
        </a>
      )}
    </article>
  );
};
