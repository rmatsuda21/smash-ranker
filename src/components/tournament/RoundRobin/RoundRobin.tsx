import { useMemo, useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";

import {
  RadioGroup,
  type RadioGroupOption,
} from "@/components/shared/RadioGroup/RadioGroup";
import { MatchBox } from "@/components/tournament/MatchBox/MatchBox";
import type {
  PoolStanding,
  TournamentEvent,
} from "@/types/tournament/Tournament";
import {
  buildCrossTable,
  buildRoundTable,
  type Round,
  type RoundPlayer,
} from "@/utils/tournament/roundRobin";

import styles from "./RoundRobin.module.scss";

type Props = {
  rounds: Round[];
  standings: PoolStanding[];
  event: TournamentEvent;
  characters: Record<string, string[]>;
  // "cross" when everyone plays everyone (round robin); "rounds" when each
  // player meets one opponent a round (Swiss), where a cross table would be
  // mostly holes.
  table: "cross" | "rounds";
};

type TableProps = Pick<Props, "rounds" | "standings">;

const Totals = ({ player }: { player: RoundPlayer }) => {
  const wins = player.wins;
  const losses = player.losses;
  return (
    <>
      <td className={styles.total}>
        <Trans>
          {wins}–{losses}
        </Trans>
      </td>
      <td className={cn(styles.total, styles.rank)}>
        {player.placement ?? "–"}
      </td>
    </>
  );
};

const TotalHeads = () => (
  <>
    <th scope="col" className={styles.total}>
      <Trans>Record</Trans>
    </th>
    <th scope="col" className={styles.total}>
      <Trans>Rank</Trans>
    </th>
  </>
);

const CrossTable = ({ rounds, standings }: TableProps) => {
  const table = useMemo(
    () => buildCrossTable(rounds, standings),
    [rounds, standings],
  );
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <td />
          {table.players.map((player) => (
            <th key={player.entrantId} scope="col" title={player.name}>
              <span>{player.name}</span>
            </th>
          ))}
          <TotalHeads />
        </tr>
      </thead>
      <tbody>
        {table.players.map((row) => (
          <tr key={row.entrantId}>
            <th scope="row" title={row.name}>
              <span>{row.name}</span>
            </th>
            {table.players.map((column) => {
              const cell = table.cells[row.entrantId]?.[column.entrantId];
              return (
                <td
                  key={column.entrantId}
                  className={cn(
                    row === column && styles.self,
                    cell?.won && styles.win,
                  )}
                >
                  {row === column ? "—" : (cell?.label ?? "")}
                </td>
              );
            })}
            <Totals player={row} />
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const RoundTable = ({ rounds, standings }: TableProps) => {
  const table = useMemo(
    () => buildRoundTable(rounds, standings),
    [rounds, standings],
  );
  return (
    <table className={cn(styles.table, styles.byRound)}>
      <thead>
        <tr>
          <td />
          {rounds.map((round, index) => (
            <th key={index} scope="col" title={round.name}>
              <span>{round.name}</span>
            </th>
          ))}
          <TotalHeads />
        </tr>
      </thead>
      <tbody>
        {table.players.map((row) => (
          <tr key={row.entrantId}>
            <th scope="row" title={row.name}>
              <span>{row.name}</span>
            </th>
            {rounds.map((_round, index) => {
              const cell = table.cells[row.entrantId]?.[index];
              return (
                <td key={index} className={cn(cell?.won && styles.win)}>
                  {cell && (
                    <>
                      {cell.label}
                      <small title={cell.opponent}>{cell.opponent}</small>
                    </>
                  )}
                </td>
              );
            })}
            <Totals player={row} />
          </tr>
        ))}
      </tbody>
    </table>
  );
};

type View = "table" | "matches";

// A stage played in rounds, as a table of results or as the sets round by
// round, with a switch between the two. The choice holds while the user
// moves between pools and phases.
export const RoundRobin = ({
  rounds,
  standings,
  event,
  characters,
  table,
}: Props) => {
  const [view, setView] = useState<View>("table");
  const options: RadioGroupOption<View>[] = [
    {
      value: "table",
      label:
        table === "cross" ? (
          <Trans>Cross table</Trans>
        ) : (
          <Trans>Results by round</Trans>
        ),
    },
    { value: "matches", label: <Trans>Matches</Trans> },
  ];

  return (
    <div className={styles.root}>
      <RadioGroup
        className={styles.views}
        options={options}
        value={view}
        onChange={setView}
      />

      {view === "table" ? (
        <section className={styles.section}>
          <div className={styles.tableScroll}>
            {table === "cross" ? (
              <CrossTable rounds={rounds} standings={standings} />
            ) : (
              <RoundTable rounds={rounds} standings={standings} />
            )}
          </div>
          <p className={styles.note}>
            {table === "cross" ? (
              <Trans>
                Each cell is the row player's score against the column player.
              </Trans>
            ) : (
              <Trans>
                Each cell is the player's score that round, over the opponent
                they played.
              </Trans>
            )}
          </p>
        </section>
      ) : (
        <div className={styles.rounds}>
          {rounds.map((round, index) => (
            <div key={index} className={styles.round}>
              <h3 className={styles.roundName}>{round.name}</h3>
              {round.sets.map((set) => (
                <MatchBox
                  key={set.id}
                  set={set}
                  event={event}
                  characters={characters}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
