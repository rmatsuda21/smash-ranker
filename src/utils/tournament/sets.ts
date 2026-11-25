import type { EventSet, SetSide, Upset } from "@/types/tournament/Tournament";
import { computeUpsetFactor } from "@/utils/results/upsetFactor";
import { isKnownCharacter } from "@/utils/top8/characterCatalog";

export type RawSet = {
  id?: string | number | null;
  fullRoundText?: string | null;
  round?: number | null;
  lPlacement?: number | null;
  winnerId?: number | null;
  displayScore?: string | null;
  completedAt?: number | null;
  vodUrl?: string | null;
  stream?: { streamName?: string | null } | null;
  phaseGroup?: {
    id?: string | number | null;
    phase?: { id?: string | number | null; name?: string | null } | null;
  } | null;
  slots?:
    | ({
        entrant?: {
          id?: string | number | null;
          name?: string | null;
          initialSeedNum?: number | null;
        } | null;
      } | null)[]
    | null;
};

const SCORE = "(-?\\d+|W|L)";

// `displayScore` reads "<name> <score> - <name> <score>", names in either
// order, or "DQ". Names can hold digits and dashes of their own, so each
// side's score is looked for right after that side's name.
export const parseSetScores = (
  displayScore: string | null | undefined,
  names: [string, string],
): { scores: [string | null, string | null]; isDQ: boolean } => {
  if (!displayScore) return { scores: [null, null], isDQ: false };
  if (/^dq$/i.test(displayScore.trim())) {
    return { scores: [null, null], isDQ: true };
  }

  const read = (first: string, second: string) => {
    if (!displayScore.startsWith(`${first} `)) return null;
    const rest = displayScore.slice(first.length + 1);
    const match = rest.match(new RegExp(`^${SCORE} - (.*) ${SCORE}$`));
    if (!match || match[2] !== second) return null;
    return [match[1], match[3]] as [string, string];
  };

  const inOrder = read(names[0], names[1]);
  const swapped = inOrder ? null : read(names[1], names[0]);
  const scores: [string | null, string | null] = inOrder
    ? inOrder
    : swapped
      ? [swapped[1], swapped[0]]
      : [null, null];

  // start.gg records a disqualified entrant's score as -1.
  const isDQ = scores.some((score) => score !== null && Number(score) < 0);
  return { scores: isDQ ? [null, null] : scores, isDQ };
};

// A finished set between two known entrants, or null for anything else
// (unplayed, a bye, a slot still waiting for its player).
export const toEventSet = (raw: RawSet): EventSet | null => {
  const [a, b] = raw.slots ?? [];
  if (!raw.id || !raw.winnerId || !a?.entrant?.id || !b?.entrant?.id) {
    return null;
  }

  const names: [string, string] = [a.entrant.name || "", b.entrant.name || ""];
  const { scores, isDQ } = parseSetScores(raw.displayScore, names);
  const sides: SetSide[] = [a.entrant, b.entrant].map((entrant, index) => ({
    entrantId: String(entrant.id),
    name: names[index],
    seed: entrant.initialSeedNum ?? null,
    score: scores[index],
  }));

  const winnerIndex = sides.findIndex(
    (side) => side.entrantId === String(raw.winnerId),
  );
  if (winnerIndex === -1) return null;

  return {
    id: String(raw.id),
    roundName: raw.fullRoundText || "",
    round: raw.round ?? null,
    loserPlacement: raw.lPlacement ?? null,
    completedAt: raw.completedAt ? raw.completedAt * 1000 : null,
    isDQ,
    winner: sides[winnerIndex],
    loser: sides[1 - winnerIndex],
    winnerSlot: winnerIndex === 0 ? 0 : 1,
    vodUrl: raw.vodUrl || null,
    streamName: raw.stream?.streamName || null,
    phaseId: raw.phaseGroup?.phase?.id ? String(raw.phaseGroup.phase.id) : null,
    groupId: raw.phaseGroup?.id ? String(raw.phaseGroup.id) : null,
    phaseName: raw.phaseGroup?.phase?.name || null,
  };
};

// Sets a lower seed won, biggest gap first. Disqualifications are not upsets.
export const findUpsets = (sets: EventSet[]): Upset[] =>
  sets
    .filter((set) => !set.isDQ && set.winner.seed && set.loser.seed)
    .map((set) => ({
      ...set,
      upsetFactor: computeUpsetFactor(set.winner.seed!, set.loser.seed!),
    }))
    .filter((set) => set.upsetFactor > 0)
    .sort(
      (a, b) =>
        b.upsetFactor - a.upsetFactor ||
        a.loser.seed! - b.loser.seed! ||
        (b.completedAt ?? 0) - (a.completedAt ?? 0),
    );

type RawGame = {
  selections?:
    | ({
        entrant?: { id?: string | number | null } | null;
        selectionValue?: number | null;
      } | null)[]
    | null;
} | null;

// Each entrant's characters across the given games, most picked first.
// Characters the site has no art for are left out.
export const countCharacters = (games: RawGame[]): Record<string, string[]> => {
  const counts = new Map<string, Map<string, number>>();
  for (const game of games) {
    for (const selection of game?.selections ?? []) {
      const entrantId = selection?.entrant?.id;
      const character = selection?.selectionValue;
      if (!entrantId || !character || !isKnownCharacter(String(character))) {
        continue;
      }
      const picks = counts.get(String(entrantId)) ?? new Map<string, number>();
      picks.set(String(character), (picks.get(String(character)) ?? 0) + 1);
      counts.set(String(entrantId), picks);
    }
  }

  return Object.fromEntries(
    [...counts].map(([entrantId, picks]) => [
      entrantId,
      [...picks].sort((a, b) => b[1] - a[1]).map(([character]) => character),
    ]),
  );
};
