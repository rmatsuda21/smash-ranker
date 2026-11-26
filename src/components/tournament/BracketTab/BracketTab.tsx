import { useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
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
import {
  progressionPills,
  type SetPills,
} from "@/utils/tournament/progression";
import { stageRounds } from "@/utils/tournament/roundRobin";
import {
  layoutBracket,
  type BracketLane,
} from "@/utils/tournament/bracketLayout";

import styles from "./BracketTab.module.scss";

// The phase and pool on screen, as the page's address holds them. Null for
// the bracket the tab opens on.
export type BracketPick = { phaseId: string | null; groupId: string | null };

type Props = {
  event: TournamentEvent;
  // For the characters of the top 8 and the champion's name.
  overview: EventOverview | null;
  // The overview has loaded or failed: no longer worth waiting for.
  overviewSettled: boolean;
  pick: BracketPick;
  // A phase or pool picked from the menus.
  onPick: (pick: BracketPick) => void;
  // The page's address with this phase and pool, for the progression pills.
  pickHref: (pick: BracketPick) => string;
};

// The bracket is drawn on a fixed grid, in pixels, so the connecting lines
// can be worked out without measuring anything. Keep these in step with the
// SCSS variables of the same names.
const MATCH_W = 200;
const MATCH_H = 52;
const COLUMN_GAP = 40;
// Leaves room under each match for its VOD link.
const SLOT_H = 72;
// A pill naming another phase's pool, and the dashed line joining it to its
// match. A column with pills before or after its matches is moved over by
// the room they take.
const PILL_W = 168;
const PILL_H = 20;
const PILL_LINK = 20;
const PILL_SPACE = PILL_W + PILL_LINK;

const LANE_LABELS = {
  winners: msg`Winners bracket`,
  losers: msg`Losers bracket`,
};

type GridNode = {
  id: string;
  column: number;
  row: number;
  feeders: string[];
  pills?: SetPills;
};

// Where each column's matches start, left to right, and how wide the lane
// is: a column whose matches have pills before them (players arriving from
// another phase) or after them (players sent on) takes room for them.
const columnPositions = (columns: number, nodes: GridNode[]) => {
  const before = Array.from({ length: columns }, () => false);
  const after = Array.from({ length: columns }, () => false);
  for (const node of nodes) {
    if (node.pills?.from.length) before[node.column] = true;
    if (node.pills?.to.length) after[node.column] = true;
  }
  const lefts: number[] = [];
  let x = 0;
  for (let column = 0; column < columns; column++) {
    if (column > 0) x += COLUMN_GAP;
    if (before[column]) x += PILL_SPACE;
    lefts.push(x);
    x += MATCH_W + (after[column] ? PILL_SPACE : 0);
  }
  return { lefts, before, width: x };
};

// The middle of a slot of a match (or of the match), from its top.
const pillY = (slot: 0 | 1 | null) =>
  slot === null ? MATCH_H / 2 : slot === 0 ? MATCH_H / 4 : (MATCH_H * 3) / 4;

// One side of a bracket on the grid: the round names, the connecting lines
// and whatever `renderMatch` puts at each node. The real bracket and its
// loading skeleton are both drawn through it, so they cannot drift apart.
const LaneFrame = ({
  label,
  heads,
  rows,
  nodes,
  renderMatch,
  pillHref,
  onPillFollow,
}: {
  label?: string;
  heads: React.ReactNode[];
  rows: number;
  nodes: GridNode[];
  renderMatch: (node: GridNode, style: React.CSSProperties) => React.ReactNode;
  // Where a pill naming the given pool leads, or null for no link.
  pillHref?: (groupId: string) => string | null;
  onPillFollow?: (event: React.MouseEvent) => void;
}) => {
  const { lefts, before, width } = columnPositions(heads.length, nodes);
  const height = (rows - 1) * SLOT_H + MATCH_H;
  const left = (column: number) => lefts[column];
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
      // In the gap, before the room of any pills in front of the match.
      const turnX =
        endX - (before[node.column] ? PILL_SPACE : 0) - COLUMN_GAP / 2;
      return [
        `M${startX} ${middle(from.row)}H${turnX}V${middle(node.row)}H${endX}`,
      ];
    }),
  );

  // Each pill: its box, and a dashed line from it to its match.
  const pills = nodes.flatMap((node) => {
    const top = node.row * SLOT_H;
    const matchLeft = left(node.column);
    return [
      ...(node.pills?.from ?? []).map((pill, index) => ({
        key: `${node.id}-from-${index}`,
        label: pill.label,
        href: pillHref?.(pill.groupId) ?? null,
        x: matchLeft - PILL_SPACE,
        y: top + pillY(pill.slot),
        link: [matchLeft - PILL_LINK, matchLeft],
      })),
      ...(node.pills?.to ?? []).map((pill, index) => ({
        key: `${node.id}-to-${index}`,
        label: pill.label,
        href: pillHref?.(pill.groupId) ?? null,
        x: matchLeft + MATCH_W + PILL_LINK,
        y: top + pillY(pill.slot),
        link: [matchLeft + MATCH_W, matchLeft + MATCH_W + PILL_LINK],
      })),
    ];
  });
  const links = pills.map(
    ({ link: [fromX, toX], y }) => `M${fromX} ${y}H${toX}`,
  );

  return (
    <section className={styles.lane} aria-label={label}>
      <div className={styles.rounds} style={{ width }}>
        {heads.map((head, index) => (
          <h3
            key={index}
            className={styles.round}
            style={{
              marginLeft:
                index === 0 ? left(0) : left(index) - left(index - 1) - MATCH_W,
            }}
          >
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
          {links.length > 0 && (
            <path className={styles.pillLinks} d={links.join("")} />
          )}
        </svg>
        {pills.map((pill) => {
          const style = { left: pill.x, top: pill.y - PILL_H / 2 };
          // A link to that pool's bracket, when the event lists it.
          return pill.href ? (
            <Link
              key={pill.key}
              className={styles.pill}
              style={style}
              href={pill.href}
              title={pill.label}
              onClick={onPillFollow}
            >
              {pill.label}
            </Link>
          ) : (
            <span
              key={pill.key}
              className={styles.pill}
              style={style}
              title={pill.label}
            >
              {pill.label}
            </span>
          );
        })}
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
  pills,
  pillHref,
  onPillFollow,
}: {
  lane: BracketLane;
  event: TournamentEvent;
  characters: Record<string, string[]>;
  pills: Map<string, SetPills>;
  pillHref: (groupId: string) => string | null;
  onPillFollow: (event: React.MouseEvent) => void;
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
        pills: pills.get(set.id),
      }))}
      pillHref={pillHref}
      onPillFollow={onPillFollow}
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

// Whether a stage holds the given pool: one of its own, or as merged Swiss
// rounds, a round's or the standings phase's.
const holdsGroup = (stage: EventPhase, groupId: string) =>
  stage.groups.some((group) => group.id === groupId) ||
  Boolean(stage.rounds?.some((round) => round.groupId === groupId)) ||
  stage.standingsGroupId === groupId;

// Phases shown as buttons; an event with more gets a menu.
const PHASE_BUTTONS = 6;

// One bracket (pool) of one of the event's phases, with every finished set:
// an elimination bracket drawn as a bracket (winners above, losers below, a
// column per round, each match joined to the one its winner played next), a
// round robin as a cross table and its rounds. It opens where the grand
// final was played; the other phases and their pools can be picked.
export const BracketTab = ({
  event,
  overview,
  overviewSettled,
  pick,
  onPick,
  pickHref,
}: Props) => {
  const { _ } = useLingui();
  const phases = useEventPhases(event);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  // A pill was followed: show the next bracket from its top left corner.
  const followedRef = useRef(false);

  const list = useMemo(() => phases.data ?? [], [phases.data]);
  const picked =
    (pick.phaseId !== null
      ? list.find((p) => p.id === pick.phaseId)
      : undefined) ??
    (pick.groupId !== null
      ? list.find((p) => holdsGroup(p, pick.groupId!))
      : undefined);
  // Before a pick: the bracket the grand final was in, which only the
  // overview knows. Until it has answered, nothing is chosen, so the wrong
  // pool is not loaded first.
  const waiting = !picked && !overviewSettled;
  const phase = waiting
    ? null
    : (picked ??
      list.find((p) => holdsPhase(p, overview?.finalPhaseId)) ??
      list[list.length - 1] ??
      null);
  const group =
    phase?.groups.find(
      (g) => g.id === (pick.groupId ?? overview?.finalGroupId),
    ) ??
    phase?.groups[0] ??
    null;

  // A pill leads to the bracket of the pool it names, when the event lists
  // it.
  const pillHref = (groupId: string) => {
    const target = list.find((p) => holdsGroup(p, groupId));
    return target ? pickHref({ phaseId: target.id, groupId }) : null;
  };
  useEffect(() => {
    if (!followedRef.current) return;
    followedRef.current = false;
    rootRef.current?.scrollIntoView({ block: "start" });
    if (scrollerRef.current) scrollerRef.current.scrollLeft = 0;
  }, [phase?.id, group?.id]);

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
  const pools = usePools(event, groupIds);
  const isElimination = ELIMINATION.includes(phase?.bracketType ?? "");
  const lanes = useMemo(
    () => (isElimination ? layoutBracket(pools.data?.[0]?.sets ?? []) : []),
    [isElimination, pools.data],
  );
  // Where players came from and go on to, beside the matches.
  const pills = useMemo(
    () =>
      isElimination && pools.data?.[0]
        ? progressionPills(pools.data[0], list)
        : new Map<string, SetPills>(),
    [isElimination, pools.data, list],
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
    <div className={styles.root} ref={rootRef}>
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
                  onChange={(phaseId) => onPick({ phaseId, groupId: null })}
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
                      onClick={() => onPick({ phaseId: p.id, groupId: null })}
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
                  onChange={(groupId) => onPick({ phaseId: phase.id, groupId })}
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
        <div className={styles.scroller} ref={scrollerRef}>
          {lanes.map((lane) => (
            <Lane
              key={lane.id}
              lane={lane}
              event={event}
              characters={characters}
              pills={pills}
              pillHref={pillHref}
              onPillFollow={(click) => {
                // Not for a click that opens the link in another tab.
                if (click.button !== 0 || click.metaKey || click.ctrlKey)
                  return;
                if (click.shiftKey || click.altKey) return;
                followedRef.current = true;
              }}
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
