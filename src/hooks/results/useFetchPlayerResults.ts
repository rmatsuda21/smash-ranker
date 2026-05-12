import { useRef } from "react";
import { useClient } from "urql";
import { t } from "@lingui/core/macro";

import { graphql } from "@/gql";
import type { PlayerTournamentResultsQuery } from "@/gql/graphql";
import { useResultsStore } from "@/store/resultsStore";
import type {
  PlayerSet,
  PlayerSetOpponent,
  PlayerTournamentResults,
} from "@/types/results/PlayerTournamentResults";
import { logEvent, logWarning } from "@/utils/observability/log";
import { computeUpsetFactor } from "@/utils/results/upsetFactor";
import {
  MISSING_SEED_FALLBACK,
  parseCharacterSelections,
  parseDisplayScore,
  parseRankings,
  parseSetRecord,
  resolveCountry,
  sortSetsByPhase,
} from "@/utils/results/parseStartggResults";

// One request usually covers a full bracket run (15-ish sets max). >64 is
// rare and silently truncating would lose data, so the hook logs a
// warning instead of paginating; revisit the cap if it starts firing.
const SETS_PER_PAGE = 64;

const PlayerTournamentResultsQueryDoc = graphql(`
  query PlayerTournamentResults(
    $entrantId: ID!
    $videogameId: ID
    $page: Int!
    $perPage: Int!
  ) {
    entrant(id: $entrantId) {
      id
      name
      initialSeedNum
      standing {
        placement
        setRecordWithoutByes
      }
      participants {
        gamerTag
        prefix
        player {
          id
          rankings(limit: 5, videogameId: $videogameId) {
            rank
            title
          }
        }
        user {
          images {
            url
            type
          }
          location {
            country
          }
        }
      }
      paginatedSets(
        page: $page
        perPage: $perPage
        sortType: RECENT
        filters: { hideEmpty: true }
      ) {
        pageInfo {
          totalPages
          total
        }
        nodes {
          id
          round
          fullRoundText
          winnerId
          startAt
          completedAt
          displayScore(mainEntrantId: $entrantId)
          phaseGroup {
            phase {
              id
              name
              phaseOrder
            }
          }
          slots {
            entrant {
              id
              name
              initialSeedNum
              standing {
                placement
              }
              participants {
                gamerTag
                prefix
                player {
                  id
                  rankings(limit: 5, videogameId: $videogameId) {
                    rank
                    title
                  }
                }
                user {
                  location {
                    country
                  }
                }
              }
            }
          }
          games {
            selections {
              entrant {
                id
              }
              character {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`);

// Convenience aliases over the codegen query type so the parse helpers
// below read naturally. Each piece is fully nullable in the schema.
type Entrant = NonNullable<PlayerTournamentResultsQuery["entrant"]>;
type SetNode = NonNullable<
  NonNullable<Entrant["paginatedSets"]>["nodes"]
>[number];
type SlotEntrant = NonNullable<
  NonNullable<NonNullable<NonNullable<SetNode>["slots"]>[number]>["entrant"]
>;

const parseOpponent = (
  oppEntrant: SlotEntrant,
  characters: PlayerSet["opponent"]["characters"],
): PlayerSetOpponent => {
  const participant = oppEntrant.participants?.[0];
  const playerId =
    participant?.player?.id != null ? String(participant.player.id) : undefined;
  const topRanking = parseRankings(participant?.player?.rankings, playerId)[0];

  return {
    id: String(oppEntrant.id),
    playerId,
    name: participant?.gamerTag || oppEntrant.name || "Unknown",
    prefix: participant?.prefix || undefined,
    country: resolveCountry(participant?.user?.location?.country),
    topRanking,
    seed: oppEntrant.initialSeedNum || MISSING_SEED_FALLBACK,
    placement: oppEntrant.standing?.placement ?? 0,
    characters,
  };
};

type ParsedSet = { set: PlayerSet; phaseTs: number | null };

const parseSet = (
  node: NonNullable<SetNode>,
  entrantId: string,
  selfSeed: number,
): ParsedSet | null => {
  const slots = (node.slots ?? []).filter((s): s is { entrant: SlotEntrant } =>
    Boolean(s?.entrant?.id),
  );
  const selfSlot = slots.find((s) => String(s.entrant.id) === entrantId);
  const oppSlot = slots.find((s) => String(s.entrant.id) !== entrantId);
  if (!selfSlot || !oppSlot) return null;

  const oppEntrant = oppSlot.entrant;
  const oppEntrantId = String(oppEntrant.id);
  const { scoreSelf, scoreOpponent, isDQ } = parseDisplayScore(
    node.displayScore,
  );
  const didWin = node.winnerId != null && String(node.winnerId) === entrantId;

  const { selfCharacters, oppCharacters } = parseCharacterSelections(
    node.games,
    entrantId,
    oppEntrantId,
  );

  const phase = node.phaseGroup?.phase;
  const phaseId = phase?.id != null ? String(phase.id) : "unknown";
  const phaseName = phase?.name || "Other";
  const phaseOrder = phase?.phaseOrder ?? Number.MAX_SAFE_INTEGER;

  // DQs aren't competitive upsets — skip the calc. Use raw nullable seeds
  // so a missing seed registers 0 (no badge) rather than the 9999 sentinel.
  const rawOppSeed = oppEntrant.initialSeedNum ?? 0;
  const upsetFactor =
    isDQ || !selfSeed || !rawOppSeed
      ? 0
      : computeUpsetFactor(
          didWin ? selfSeed : rawOppSeed,
          didWin ? rawOppSeed : selfSeed,
        );

  const startAtMs = node.startAt ? node.startAt * 1000 : undefined;
  const completedAtMs = node.completedAt ? node.completedAt * 1000 : undefined;
  const phaseTs = completedAtMs ?? startAtMs ?? null;

  return {
    set: {
      id: String(node.id),
      fullRoundText: node.fullRoundText || "",
      round: node.round ?? 0,
      scoreSelf,
      scoreOpponent,
      didWin,
      isDQ,
      startAtMs,
      upsetFactor: upsetFactor > 0 ? upsetFactor : undefined,
      phaseId,
      phaseName,
      phaseOrder,
      selfCharacters,
      opponent: parseOpponent(oppEntrant, oppCharacters),
    },
    phaseTs,
  };
};

export const useFetchPlayerResults = () => {
  const client = useClient();
  const dispatch = useResultsStore((state) => state.dispatch);
  // Monotonic token — a fetch only writes back if its token still matches
  // the latest call. Prevents a slow in-flight fetch from clobbering a
  // newer selection (user clicks A, then B before A resolves).
  const requestIdRef = useRef(0);

  const fetchPlayerResults = async (entrantId: string) => {
    const myRequest = ++requestIdRef.current;
    dispatch({ type: "FETCH_RESULTS_START" });

    // Snapshot tournament context at call time so a slow fetch doesn't
    // pin stale values and so the catch block below has them available
    // for error logs (useful for reproducing issues + filing start.gg
    // upstream reports — every fail carries the slug + ids you'd need).
    const { videogameId, tournamentUrl } = useResultsStore.getState();
    // Lifted out of the try block so the catch can include it when we
    // failed after parsing player info but before dispatching success.
    let playerId: string | undefined;

    try {
      const result = await client
        .query(PlayerTournamentResultsQueryDoc, {
          entrantId,
          videogameId: videogameId ?? null,
          page: 1,
          perPage: SETS_PER_PAGE,
        })
        .toPromise();

      if (myRequest !== requestIdRef.current) return;

      if (result.error || !result.data?.entrant) {
        throw new Error(
          result.error?.message || t`Player results not available.`,
        );
      }

      const entrant = result.data.entrant;
      const participant = entrant.participants?.[0];
      const name = participant?.gamerTag || entrant.name || "Unknown";
      const prefix = participant?.prefix || undefined;
      const country = resolveCountry(participant?.user?.location?.country);
      playerId =
        participant?.player?.id != null
          ? String(participant.player.id)
          : undefined;
      const rankings = parseRankings(participant?.player?.rankings, playerId);
      const iconUrl =
        participant?.user?.images
          ?.find((img) => img?.type === "profile")
          ?.url?.replace("http://", "https://") || undefined;
      const seed = entrant.initialSeedNum ?? MISSING_SEED_FALLBACK;
      const placement = entrant.standing?.placement ?? 0;
      const record = parseSetRecord(entrant.standing?.setRecordWithoutByes);

      const pageInfo = entrant.paginatedSets?.pageInfo;
      if ((pageInfo?.totalPages ?? 1) > 1) {
        // We only request page 1. >64 sets in a bracket run is rare but
        // possible (super-long round-robins); warn so we can revisit
        // pagination if it shows up in logs.
        logWarning("results player set list truncated", {
          area: "results-fetch",
          tournament_platform: "startgg",
          tournament_url: tournamentUrl,
          videogame_id: videogameId,
          entrant_id: entrantId,
          player_id: playerId,
          total: pageInfo?.total ?? null,
          totalPages: pageInfo?.totalPages ?? null,
        });
      }

      const setNodes = entrant.paginatedSets?.nodes ?? [];
      const sets: PlayerSet[] = [];
      const phaseTemporalKey = new Map<string, number>();
      const selfSeed = entrant.initialSeedNum ?? 0;
      const stringEntrantId = String(entrantId);

      for (const node of setNodes) {
        if (!node) continue;
        const parsed = parseSet(node, stringEntrantId, selfSeed);
        if (!parsed) continue;
        sets.push(parsed.set);
        if (parsed.phaseTs != null) {
          const existing = phaseTemporalKey.get(parsed.set.phaseId);
          if (existing === undefined || parsed.phaseTs < existing) {
            phaseTemporalKey.set(parsed.set.phaseId, parsed.phaseTs);
          }
        }
      }

      // sortType: RECENT returns newest-first; reverse so intra-phase order
      // is oldest-first, then sortSetsByPhase preserves that via stable sort.
      sets.reverse();
      sortSetsByPhase(sets, phaseTemporalKey);

      const payload: PlayerTournamentResults = {
        entrantId: String(entrant.id),
        playerId,
        name,
        prefix,
        country,
        iconUrl,
        rankings,
        seed,
        placement,
        wins: record.wins,
        losses: record.losses,
        sets,
      };

      dispatch({ type: "FETCH_RESULTS_SUCCESS", payload });
      logEvent("results_entrant_select", {
        seed,
        set_count: sets.length,
        placement,
      });
    } catch (error) {
      if (myRequest !== requestIdRef.current) return;
      const message =
        error instanceof Error
          ? error.message
          : t`Failed to fetch player results`;
      logWarning("results player-fetch failed", {
        area: "results-fetch",
        tournament_platform: "startgg",
        tournament_url: tournamentUrl,
        videogame_id: videogameId,
        entrant_id: entrantId,
        player_id: playerId,
        error: message,
      });
      dispatch({ type: "FETCH_RESULTS_FAIL", payload: message });
      logEvent("results_fetch_fail", {
        tournament_platform: "startgg",
        stage: "player",
        reason: "query_error",
        tournament_url: tournamentUrl,
        videogame_id: videogameId,
        entrant_id: entrantId,
        player_id: playerId ?? null,
      });
    }
  };

  return { fetchPlayerResults };
};
