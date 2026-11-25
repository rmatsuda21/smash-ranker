import { useMemo, useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { FaTrophy } from "react-icons/fa6";

import { DropDownSelect } from "@/components/shared/DropDownSelect/DropDownSelect";
import { MatchBox } from "@/components/tournament/MatchBox/MatchBox";
import { RoundRobin } from "@/components/tournament/RoundRobin/RoundRobin";
import { LoadFailed } from "@/components/tournament/TournamentParts/TournamentParts";
import { useEventPhases } from "@/hooks/tournament/useEventPhases";
import { usePools } from "@/hooks/tournament/usePool";
import type {
  EventOverview,
  EventPhase,
  TournamentEvent,
} from "@/types/tournament/Tournament";
import { stageRounds } from "@/utils/tournament/roundRobin";
import {
  layoutBracket,
  type BracketLane,
} from "@/utils/tournament/bracketLayout";

import styles from "./BracketTab.module.scss";

type Props = {
  event: TournamentEvent;
  // For the characters of the top 8 and the champion's name.
  overview: EventOverview | null;
  // The overview has loaded or failed: no longer worth waiting for.
  overviewSettled: boolean;
};

// The bracket is drawn on a fixed grid, in pixels, so the connecting lines
// can be worked out without measuring anything. Keep these in step with the
// SCSS variables of the same names.
const MATCH_W = 224;
const MATCH_H = 64;
const COLUMN_GAP = 40;
const SLOT_H = 84;
const COLUMN_W = MATCH_W + COLUMN_GAP;

const LANE_LABELS = {
  winners: msg`Winners bracket`,
  losers: msg`Losers bracket`,
};

type GridNode = { id: string; column: number; row: number; feeders: string[] };

// One side of a bracket on the grid: the round names, the connecting lines
// and whatever `renderMatch` puts at each node. The real bracket and its
// loading skeleton are both drawn through it, so they cannot drift apart.
const LaneFrame = ({
  label,
  heads,
  rows,
  nodes,
  renderMatch,
}: {
  label?: string;
  heads: React.ReactNode[];
  rows: number;
  nodes: GridNode[];
  renderMatch: (node: GridNode, style: React.CSSProperties) => React.ReactNode;
}) => {
  const width = heads.length * COLUMN_W - COLUMN_GAP;
  const height = (rows - 1) * SLOT_H + MATCH_H;
  const left = (column: number) => column * COLUMN_W;
  const middle = (row: number) => row * SLOT_H + MATCH_H / 2;

  const byId = new Map(nodes.map((node) => [node.id, node]));
  // From the right edge of each feeder, across half the gap, up or down to
  // the next match's height, and into its left edge.
  const lines = nodes.flatMap((node) =>
    node.feeders.flatMap((id) => {
      const from = byId.get(id);
      if (!from) return [];
      const startX = left(from.column) + MATCH_W;
      const endX = left(node.column);
      const turnX = endX - COLUMN_GAP / 2;
      return [
        `M${startX} ${middle(from.row)}H${turnX}V${middle(node.row)}H${endX}`,
      ];
    }),
  );

  return (
    <section className={styles.lane} aria-label={label}>
      <div className={styles.rounds} style={{ width }}>
        {heads.map((head, index) => (
          <h3 key={index} className={styles.round}>
            {head}
          </h3>
        ))}
      </div>
      <div className={styles.field} style={{ width, height }}>
        <svg
          className={styles.lines}
          width={width}
          height={height}
          aria-hidden="true"
        >
          <path d={lines.join("")} />
        </svg>
        {nodes.map((node) =>
          renderMatch(node, {
            left: left(node.column),
            top: node.row * SLOT_H,
          }),
        )}
      </div>
    </section>
  );
};

const Lane = ({
  lane,
  event,
  characters,
}: {
  lane: BracketLane;
  event: TournamentEvent;
  characters: Record<string, string[]>;
}) => {
  const { _ } = useLingui();
  const sets = new Map(lane.nodes.map((node) => [node.set.id, node.set]));
  return (
    <LaneFrame
      label={_(LANE_LABELS[lane.id])}
      heads={lane.columns}
      rows={lane.rows}
      nodes={lane.nodes.map(({ set, column, row, feeders }) => ({
        id: set.id,
        column,
        row,
        feeders,
      }))}
      renderMatch={(node, style) => (
        <MatchBox
          key={node.id}
          className={styles.placed}
          style={style}
          set={sets.get(node.id)!}
          event={event}
          characters={characters}
        />
      )}
    />
  );
};

// A bracket of `size` first-round matches narrowing to one, then `tail`
// more single matches (a losers side holds its width for a round before
// each halving; the skeleton keeps to the plain shape).
const skeletonLane = (prefix: string, size: number, tail: number) => {
  const nodes: GridNode[] = [];
  let previous: GridNode[] = [];
  let column = 0;
  for (let count = size; count >= 1; count /= 2, column++) {
    const current: GridNode[] = [];
    for (let index = 0; index < count; index++) {
      const feeders = previous.slice(index * 2, index * 2 + 2);
      current.push({
        id: `${prefix}${column}-${index}`,
        column,
        row:
          feeders.length > 0
            ? (feeders[0].row + feeders[feeders.length - 1].row) / 2
            : index,
        feeders: feeders.map((feeder) => feeder.id),
      });
    }
    nodes.push(...current);
    previous = current;
  }
  for (let extra = 0; extra < tail; extra++, column++) {
    const node = {
      id: `${prefix}${column}-0`,
      column,
      row: previous[0].row,
      feeders: [previous[0].id],
    };
    nodes.push(node);
    previous = [node];
  }
  return { nodes, columns: column, rows: size };
};

const SKELETON_LANES = {
  // A top 8: winners semi-finals to the grand final over the losers side.
  double: [skeletonLane("w", 2, 1), skeletonLane("l", 2, 1)],
  single: [skeletonLane("s", 4, 0)],
};

// What is coming, in outline: a bracket's boxes and lines, or a table's
// rows, at the size the real thing will have. Shown while a pool loads.
const BracketSkeleton = ({ kind }: { kind: "double" | "single" | "table" }) => {
  if (kind === "table") {
    return (
      <div className={styles.tableSkeleton} aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    );
  }
  return (
    <div className={styles.scroller} aria-hidden="true">
      {SKELETON_LANES[kind].map((lane, index) => (
        <LaneFrame
          key={index}
          heads={Array.from({ length: lane.columns }, (_, column) => (
            <span key={column} className={styles.headBone} />
          ))}
          rows={lane.rows}
          nodes={lane.nodes}
          renderMatch={(node, style) => (
            <div
              key={node.id}
              className={cn(styles.placed, styles.matchBone)}
              style={style}
            />
          )}
        />
      ))}
    </div>
  );
};

// start.gg's bracket types that are drawn as a bracket. Anything else is
// played in rounds and shown as a list of them.
const ELIMINATION = ["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION"];

const FORMAT_LABELS: Record<string, ReturnType<typeof msg>> = {
  SINGLE_ELIMINATION: msg`Single elimination`,
  DOUBLE_ELIMINATION: msg`Double elimination`,
  ROUND_ROBIN: msg`Round robin`,
  SWISS: msg`Swiss`,
};

// Whether a stage is, or as merged Swiss rounds includes, the given phase.
const holdsPhase = (stage: EventPhase, phaseId: string | null | undefined) =>
  Boolean(phaseId) &&
  (stage.id === phaseId ||
    Boolean(stage.rounds?.some((round) => round.phaseId === phaseId)));

// Phases shown as buttons; an event with more gets a menu.
const PHASE_BUTTONS = 6;

// One bracket (pool) of one of the event's phases, with every finished set:
// an elimination bracket drawn as a bracket (winners above, losers below, a
// column per round, each match joined to the one its winner played next), a
// round robin as a cross table and its rounds. It opens where the grand
// final was played; the other phases and their pools can be picked.
export const BracketTab = ({ event, overview, overviewSettled }: Props) => {
  const { _ } = useLingui();
  const phases = useEventPhases(event.id);
  // What the user picked on this visit.
  const [picked, setPicked] = useState<{
    phaseId: string | null;
    groupId: string | null;
  }>({ phaseId: null, groupId: null });

  const list = useMemo(() => phases.data ?? [], [phases.data]);
  // Before a pick: the bracket the grand final was in, which only the
  // overview knows. Until it has answered, nothing is chosen, so the wrong
  // pool is not loaded first.
  const waiting = picked.phaseId === null && !overviewSettled;
  const phase = waiting
    ? null
    : (list.find((p) => p.id === picked.phaseId) ??
      list.find((p) => holdsPhase(p, overview?.finalPhaseId)) ??
      list[list.length - 1] ??
      null);
  const group =
    phase?.groups.find(
      (g) => g.id === (picked.groupId ?? overview?.finalGroupId),
    ) ??
    phase?.groups[0] ??
    null;

  // A Swiss stage held as a phase per round is all of its rounds' pools,
  // then the pool that holds its final ranking; anything else is the one
  // pool picked.
  const groupIds = useMemo(
    () =>
      phase?.rounds
        ? [
            ...phase.rounds.map((round) => round.groupId),
            ...(phase.standingsGroupId ? [phase.standingsGroupId] : []),
          ]
        : group
          ? [group.id]
          : [],
    [phase, group],
  );
  const pools = usePools(groupIds);
  const isElimination = ELIMINATION.includes(phase?.bracketType ?? "");
  const lanes = useMemo(
    () => (isElimination ? layoutBracket(pools.data?.[0]?.sets ?? []) : []),
    [isElimination, pools.data],
  );
  const rounds = useMemo(
    () =>
      isElimination || !pools.data
        ? []
        : phase?.rounds
          ? stageRounds(
              pools.data.slice(0, phase.rounds.length),
              phase.rounds.map((round) => round.name),
            )
          : stageRounds(pools.data),
    [isElimination, pools.data, phase],
  );
  // A round's own pool ranks that round alone, so a Swiss stage in rounds
  // is ranked only when a standings phase came with it.
  const standings = !pools.data
    ? []
    : phase?.rounds
      ? phase.standingsGroupId
        ? pools.data[pools.data.length - 1].standings
        : []
      : (pools.data[0]?.standings ?? []);
  const setCount = (pools.data ?? []).reduce(
    (count, pool) => count + pool.sets.length,
    0,
  );

  // A merged Swiss stage has no name of its own: it goes by its format.
  const nameOf = (p: EventPhase) =>
    p.name || _(FORMAT_LABELS[p.bracketType ?? ""] ?? msg`Bracket`);
  const describe = (p: EventPhase) => {
    const format = FORMAT_LABELS[p.bracketType ?? ""];
    return [
      format && p.name ? _(format) : null,
      p.numSeeds > 0 ? p.numSeeds : null,
    ]
      .filter((part) => part !== null)
      .join(" · ");
  };
  const phaseOptions = list.map((p) => ({
    value: p.id,
    id: p.id,
    display: nameOf(p),
  }));
  const poolOptions = useMemo(
    () =>
      (phase?.groups ?? []).map((g) => ({
        value: g.id,
        id: g.id,
        display: g.label,
      })),
    [phase],
  );

  if (phases.status === "error" || pools.status === "error") {
    return (
      <LoadFailed
        className={styles.message}
        onRetry={() => {
          if (phases.status === "error") phases.retry();
          if (pools.status === "error") pools.retry();
        }}
      />
    );
  }
  if (phases.data && list.length === 0) {
    return (
      <p className={styles.message}>
        <Trans>This event has no bracket yet.</Trans>
      </p>
    );
  }

  const champion =
    phase !== null &&
    holdsPhase(phase, overview?.finalPhaseId) &&
    event.status === "finished" &&
    overview?.standings[0]?.placement === 1
      ? overview.standings[0].name
      : null;
  const characters = overview?.characters ?? {};

  return (
    <div className={styles.root}>
      {phase &&
        (list.length > 1 || (!phase.rounds && poolOptions.length > 1)) && (
          <div className={styles.pickers}>
            {list.length > PHASE_BUTTONS ? (
              <div className={styles.pick}>
                <span>
                  <Trans>Phase</Trans>
                </span>
                <DropDownSelect
                  className={styles.phaseSelect}
                  options={phaseOptions}
                  selectedValue={phase.id}
                  searchable
                  onChange={(phaseId) => setPicked({ phaseId, groupId: null })}
                />
                <span className={styles.phaseMeta}>{describe(phase)}</span>
              </div>
            ) : (
              list.length > 1 && (
                <div
                  className={styles.phases}
                  role="group"
                  aria-label={_(msg`Phase`)}
                >
                  {list.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={cn(
                        styles.phase,
                        p === phase && styles.selected,
                      )}
                      aria-pressed={p === phase}
                      onClick={() =>
                        setPicked({ phaseId: p.id, groupId: null })
                      }
                    >
                      <strong>{nameOf(p)}</strong>
                      <small>{describe(p)}</small>
                    </button>
                  ))}
                </div>
              )
            )}
            {group && !phase.rounds && poolOptions.length > 1 && (
              <div className={styles.pick}>
                <span>
                  <Trans>Pool</Trans>
                </span>
                <DropDownSelect
                  className={styles.poolSelect}
                  options={poolOptions}
                  selectedValue={group.id}
                  searchable={poolOptions.length > 12}
                  onChange={(groupId) =>
                    setPicked({ phaseId: phase.id, groupId })
                  }
                />
              </div>
            )}
          </div>
        )}

      {champion && (
        <p className={styles.champion}>
          <FaTrophy aria-hidden="true" />
          <Trans>Champion: {champion}</Trans>
        </p>
      )}

      {!phases.data && (
        <div className={styles.pickerBones} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}

      {!pools.data ? (
        <BracketSkeleton
          kind={
            !phase || phase.bracketType === "DOUBLE_ELIMINATION"
              ? "double"
              : isElimination
                ? "single"
                : "table"
          }
        />
      ) : setCount === 0 ? (
        <p className={styles.message}>
          <Trans>No sets have been played in this bracket yet.</Trans>
        </p>
      ) : isElimination ? (
        <div className={styles.scroller}>
          {lanes.map((lane) => (
            <Lane
              key={lane.id}
              lane={lane}
              event={event}
              characters={characters}
            />
          ))}
        </div>
      ) : (
        <RoundRobin
          rounds={rounds}
          standings={standings}
          event={event}
          characters={characters}
          table={phase?.bracketType === "ROUND_ROBIN" ? "cross" : "rounds"}
        />
      )}
    </div>
  );
};
