import { msg } from "@lingui/core/macro";
import { I18n, MessageDescriptor } from "@lingui/core";

import { PlayerInfo } from "@/types/top8/Player";

export type TokenOption = {
  token: string;
  label: string;
  group: string;
};

/** Friendly label for a token name like `winner1.handle` → `Winner #1 handle`. */
export const formatTokenLabel = (token: string, i18n: I18n): string => {
  if (token === "tournament.name") return i18n._(msg`Tournament name`);
  if (token === "tournament.url") return i18n._(msg`Tournament URL`);
  if (token === "tournament.date") return i18n._(msg`Tournament date`);

  const winnerHandle = token.match(/^winner(\d+)\.handle$/);
  if (winnerHandle) {
    return i18n._(msg`Winner #${winnerHandle[1]} handle`);
  }
  const winnerTag = token.match(/^winner(\d+)\.tag$/);
  if (winnerTag) {
    return i18n._(msg`Winner #${winnerTag[1]} tag`);
  }
  const winnerName = token.match(/^winner(\d+)\.name$/);
  if (winnerName) {
    // Legacy token used by older saved templates; surface it for clarity.
    return i18n._(msg`Winner #${winnerName[1]} name`);
  }

  return `{{${token}}}`;
};

/**
 * IMPORTANT: token values are stored as bare names (no `{{...}}` braces).
 * Consumers — `resolveSingleToken`, `formatTokenLabel`, `insertTokenAt` —
 * all expect the bare form and add braces themselves when needed. Storing
 * with braces here would lead to double-wrapping (`{{{{winner1.handle}}}}`)
 * when inserted, which the resolver can't parse.
 */
const tournamentTokens: Array<{
  token: string;
  label: MessageDescriptor;
}> = [
  { token: "tournament.name", label: msg`Tournament name` },
  { token: "tournament.url", label: msg`Tournament URL` },
  { token: "tournament.date", label: msg`Tournament date` },
];

export const getInsertableTokens = (
  i18n: I18n,
  players: PlayerInfo[],
): TokenOption[] => {
  const groups = {
    tournament: i18n._(msg`Tournament`),
    winner: i18n._(msg`Winners`),
  };

  const tournament: TokenOption[] = tournamentTokens.map((t) => ({
    token: t.token,
    label: i18n._(t.label),
    group: groups.tournament,
  }));

  const sorted = [...players].sort((a, b) => a.placement - b.placement);
  const limit = Math.min(sorted.length, 8);
  const winners: TokenOption[] = [];
  for (let i = 0; i < limit; i++) {
    const placement = i + 1;
    winners.push({
      token: `winner${placement}.handle`,
      label: i18n._(msg`Winner #${placement} handle`),
      group: groups.winner,
    });
    winners.push({
      token: `winner${placement}.tag`,
      label: i18n._(msg`Winner #${placement} tag`),
      group: groups.winner,
    });
  }

  return [...tournament, ...winners];
};
