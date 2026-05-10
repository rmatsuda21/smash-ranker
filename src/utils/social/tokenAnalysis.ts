import { PlayerInfo } from "@/types/top8/Player";
import { TournamentInfo } from "@/types/top8/Tournament";
import { SocialPlatform } from "@/types/social/SocialTemplate";

import { resolveSocialTemplate } from "./resolveSocialTemplate";

export type TokenMatch = {
  start: number;
  end: number;
  token: string;
};

export type AnalysisContext = {
  players: PlayerInfo[];
  tournament: Partial<TournamentInfo>;
  platform: SocialPlatform;
};

type Matcher = {
  value: string;
  token: string;
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const resolveSingleToken = (
  token: string,
  ctx: AnalysisContext,
): string => resolveSocialTemplate(`{{${token}}}`, ctx);

/**
 * Build the list of plain-text patterns that should auto-tokenize when the
 * user types them. Sorted longest-first so a multi-word player name wins over
 * a substring match.
 */
export const getMatchers = (ctx: AnalysisContext): Matcher[] => {
  const out: Matcher[] = [];

  if (ctx.tournament.url) {
    out.push({ value: ctx.tournament.url, token: "tournament.url" });
  }
  if (ctx.tournament.tournamentName) {
    out.push({
      value: ctx.tournament.tournamentName,
      token: "tournament.name",
    });
  }
  if (ctx.tournament.date) {
    out.push({ value: ctx.tournament.date, token: "tournament.date" });
  }

  const sorted = [...ctx.players].sort((a, b) => a.placement - b.placement);
  sorted.slice(0, 8).forEach((player, idx) => {
    const placement = idx + 1;
    // What `winnerN.handle` resolves to for the current platform — the
    // matcher value mirrors that so typing the visible handle auto-tokenizes.
    let handleValue: string | null = null;
    if (ctx.platform === "x" && player.twitter) {
      const stripped = player.twitter.startsWith("@")
        ? player.twitter.slice(1)
        : player.twitter;
      handleValue = `@${stripped}`;
    } else if (player.name) {
      handleValue = player.name;
    } else if (player.gamerTag) {
      handleValue = player.gamerTag;
    }
    if (handleValue) {
      out.push({ value: handleValue, token: `winner${placement}.handle` });
    }
    if (player.gamerTag) {
      out.push({
        value: player.gamerTag,
        token: `winner${placement}.tag`,
      });
    }
  });

  return out
    .filter((m) => m.value.trim().length > 0)
    .sort((a, b) => b.value.length - a.value.length);
};

const isWordChar = (ch: string) => /\w/.test(ch);

const buildMatcherRegex = (value: string): RegExp => {
  const startsWord = isWordChar(value[0]);
  const endsWord = isWordChar(value[value.length - 1]);
  const startsAt = value[0] === "@";
  const prefix = startsWord ? "(?<![\\w@])" : startsAt ? "(?<![\\w@])" : "";
  const suffix = endsWord ? "(?![\\w])" : "";
  return new RegExp(`${prefix}${escapeRegex(value)}${suffix}`, "g");
};

const matcherRegexCache = new WeakMap<Matcher[], Map<string, RegExp>>();
const getCachedRegex = (matchers: Matcher[], value: string): RegExp => {
  let cache = matcherRegexCache.get(matchers);
  if (!cache) {
    cache = new Map();
    matcherRegexCache.set(matchers, cache);
  }
  let regex = cache.get(value);
  if (!regex) {
    regex = buildMatcherRegex(value);
    cache.set(value, regex);
  }
  regex.lastIndex = 0;
  return regex;
};

/**
 * Find all matcher hits inside `text[fromIdx..toIdx)`. Earlier matches
 * (longer-first matchers) win — overlapping ranges are skipped.
 */
export const findMatchesInRange = (
  text: string,
  fromIdx: number,
  toIdx: number,
  matchers: Matcher[],
): TokenMatch[] => {
  if (fromIdx >= toIdx) return [];
  const slice = text.slice(fromIdx, toIdx);
  const occupied = new Array(slice.length).fill(false);
  const found: TokenMatch[] = [];

  for (const matcher of matchers) {
    if (!matcher.value) continue;
    const regex = getCachedRegex(matchers, matcher.value);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(slice)) !== null) {
      const localStart = m.index;
      const localEnd = m.index + m[0].length;
      let overlap = false;
      for (let i = localStart; i < localEnd; i++) {
        if (occupied[i]) {
          overlap = true;
          break;
        }
      }
      if (overlap) continue;
      for (let i = localStart; i < localEnd; i++) occupied[i] = true;
      found.push({
        start: localStart + fromIdx,
        end: localEnd + fromIdx,
        token: matcher.token,
      });
    }
  }

  return found.sort((a, b) => a.start - b.start);
};

export const findAllMatches = (
  text: string,
  matchers: Matcher[],
): TokenMatch[] => findMatchesInRange(text, 0, text.length, matchers);

const computeMaxMatcherLength = (matchers: Matcher[]): number => {
  let max = 0;
  for (const m of matchers) {
    if (m.value.length > max) max = m.value.length;
  }
  return max;
};

/**
 * Diff oldText vs newText and return the change region. Common-prefix and
 * common-suffix length finder — O(n) and good enough for the short text the
 * composer holds.
 */
const diffRange = (
  oldText: string,
  newText: string,
): { prefix: number; oldEnd: number; newEnd: number } => {
  let prefix = 0;
  const minLen = Math.min(oldText.length, newText.length);
  while (prefix < minLen && oldText[prefix] === newText[prefix]) prefix++;
  let oldEnd = oldText.length;
  let newEnd = newText.length;
  while (
    oldEnd > prefix &&
    newEnd > prefix &&
    oldText[oldEnd - 1] === newText[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }
  return { prefix, oldEnd, newEnd };
};

/**
 * Update an existing match list given a text edit. Drops matches that overlap
 * the changed region, shifts matches after it by the length delta, and only
 * re-scans a small window around the change for new auto-detected tokens.
 */
export const updateMatchesAfterEdit = (
  oldText: string,
  oldMatches: TokenMatch[],
  newText: string,
  matchers: Matcher[],
): TokenMatch[] => {
  if (oldText === newText) return oldMatches;
  const { prefix, oldEnd, newEnd } = diffRange(oldText, newText);
  const delta = newEnd - oldEnd;
  const buffer = computeMaxMatcherLength(matchers);

  const preserved: TokenMatch[] = [];
  for (const m of oldMatches) {
    if (m.end <= prefix) {
      preserved.push(m);
    } else if (m.start >= oldEnd) {
      preserved.push({ ...m, start: m.start + delta, end: m.end + delta });
    }
    // else: overlaps the change → discard
  }

  const scanStart = Math.max(0, prefix - buffer);
  const scanEnd = Math.min(newText.length, newEnd + buffer);
  const fresh = findMatchesInRange(newText, scanStart, scanEnd, matchers);

  // Merge: drop fresh matches that overlap a preserved one (e.g. tail-region
  // matches that we already kept after the shift).
  const merged: TokenMatch[] = [...preserved];
  for (const f of fresh) {
    const overlaps = merged.some(
      (p) => !(f.end <= p.start || f.start >= p.end),
    );
    if (!overlaps) merged.push(f);
  }
  return merged.sort((a, b) => a.start - b.start);
};

/** Convert a template body (with {{...}}) into displayed text + match ranges. */
export const resolveWithRanges = (
  body: string,
  ctx: AnalysisContext,
): { text: string; matches: TokenMatch[] } => {
  const TOKEN_REGEX = /\{\{([^}]+)\}\}/g;
  let text = "";
  const matches: TokenMatch[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_REGEX.exec(body)) !== null) {
    text += body.slice(lastIdx, m.index);
    const token = m[1].trim();
    const resolved = resolveSingleToken(token, ctx);
    const start = text.length;
    text += resolved;
    const end = text.length;
    if (end > start) matches.push({ start, end, token });
    lastIdx = TOKEN_REGEX.lastIndex;
  }
  text += body.slice(lastIdx);
  return { text, matches };
};

/** Walk the displayed text and produce a body string with {{token}} substitutions. */
export const stitchToBody = (text: string, matches: TokenMatch[]): string => {
  const sorted = [...matches].sort((a, b) => a.start - b.start);
  let body = "";
  let cursor = 0;
  for (const m of sorted) {
    if (m.start < cursor) continue;
    body += text.slice(cursor, m.start);
    body += `{{${m.token}}}`;
    cursor = m.end;
  }
  body += text.slice(cursor);
  return body;
};

/**
 * When the platform changes (X ↔ Bluesky), token resolutions can shift
 * (e.g. `@handle` vs plain gamerTag). Walk the existing matches, swap each
 * resolved value for its new platform-aware version, and update positions.
 */
export const reresolveForContext = (
  text: string,
  matches: TokenMatch[],
  newCtx: AnalysisContext,
): { text: string; matches: TokenMatch[] } => {
  const sorted = [...matches].sort((a, b) => a.start - b.start);
  let nextText = "";
  const nextMatches: TokenMatch[] = [];
  let cursor = 0;
  for (const m of sorted) {
    if (m.start < cursor) continue;
    nextText += text.slice(cursor, m.start);
    const resolved = resolveSingleToken(m.token, newCtx);
    const start = nextText.length;
    nextText += resolved;
    const end = nextText.length;
    if (end > start) nextMatches.push({ start, end, token: m.token });
    cursor = m.end;
  }
  nextText += text.slice(cursor);
  return { text: nextText, matches: nextMatches };
};

/**
 * Insert a token's resolved value at `cursor`, shifting existing matches and
 * adding a new match for the inserted range.
 */
export const insertTokenAt = (
  text: string,
  matches: TokenMatch[],
  token: string,
  ctx: AnalysisContext,
  cursor: number,
): { text: string; matches: TokenMatch[]; cursorAfter: number } => {
  const resolved = resolveSingleToken(token, ctx);
  const safeCursor = Math.max(0, Math.min(cursor, text.length));
  const nextText =
    text.slice(0, safeCursor) + resolved + text.slice(safeCursor);
  const newMatch: TokenMatch = {
    start: safeCursor,
    end: safeCursor + resolved.length,
    token,
  };

  const shifted: TokenMatch[] = [];
  for (const m of matches) {
    if (m.end <= safeCursor) {
      shifted.push(m);
    } else if (m.start >= safeCursor) {
      shifted.push({
        ...m,
        start: m.start + resolved.length,
        end: m.end + resolved.length,
      });
    }
    // overlapping match: drop (caller asked to insert into a token boundary)
  }
  shifted.push(newMatch);
  shifted.sort((a, b) => a.start - b.start);

  return { text: nextText, matches: shifted, cursorAfter: newMatch.end };
};
