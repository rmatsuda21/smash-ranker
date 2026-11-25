// The parts of Hivee's API (https://hivee.jp/api/v1/openapi.json) the site
// reads. Hivee adds fields without notice; anything not listed is ignored.

export type HiveeProgram = {
  id: string;
  title: string;
  // Game code ("smash_sp"), null for a program that is not a game.
  content: string | null;
  // single_elim / double_elim / round_robin / swiss / matchmaking; null for
  // a program with no bracket (a break, a side activity).
  format: string | null;
  // The program whose placements `rank_from`..`rank_to` play in this one.
  feeder: {
    program_id: string;
    rank_from: number;
    rank_to: number | null;
  } | null;
  // How many pools its matches are split into (1 for a bracket).
  pool_count: number;
  state: "before" | "running" | "ended" | "canceled";
};

export type HiveeEvent = {
  id: string;
  // The event's page on Hivee.
  url: string;
  title: string;
  progress: "before" | "live" | "ended";
  starts_at: string | null;
  ends_at: string | null;
  // offline / online / hybrid
  venue_type: string;
  venue: string | null;
  venue_address: string | null;
  country: string | null;
  prefecture_name: string | null;
  cover_image_url: string | null;
  community: { name: string; icon_url: string | null };
  programs: HiveeProgram[];
};

export type HiveeEntrant = {
  id: string;
  display_name: string;
  programs: { program_id: string; seed: number | null }[];
};

export type HiveeStandingRow = {
  // Ties share a placement. Null for someone still in the bracket, or
  // disqualified.
  placement: number | null;
  participant_id: string;
  // Null without an API key for someone whose name is not public.
  display_name: string | null;
  disqualified: boolean;
  // The pool the row's player was in, for a program split into pools.
  pool: number | null;
  // The program the row's placement was earned in: in a final bracket's
  // combined standings, the qualifier for those who did not move on.
  source_program_id: string;
};

export type HiveeStandings = {
  program_id: string;
  // The programs the placements cover: a final bracket's standings include
  // the qualifiers that fed it.
  phases: { program_id: string; title: string }[];
  rows: HiveeStandingRow[];
};

export type HiveeMatchSlot = {
  participant_id: string | null;
  // Null without an API key for someone whose name is not public.
  display_name: string | null;
  score: number | null;
  // In the order they were played. `color` is the costume, 0 to 7 (1P to
  // 8P), null when not entered and for Mii fighters.
  characters: { code: string; color: number | null }[];
};

export type HiveeMatch = {
  id: string;
  program_id: string | null;
  // main / winners / losers / grand_final
  bracket: string;
  round: number;
  // The round's name as Hivee shows it ("Winners Final", "準決勝"); every
  // round of a round robin has the same one.
  round_label: string;
  // Which of the program's pools the match belongs to, from 1.
  pool: number;
  slots: HiveeMatchSlot[];
  winner_id: string | null;
  dq: { participant_id: string | null; both: boolean };
  stream_url: string | null;
  started_at: string | null;
  ended_at: string | null;
};

export type HiveeResolvedUrl =
  | { type: "event"; event_id: string; program_id: string | null }
  | { type: "community"; handle: string };
