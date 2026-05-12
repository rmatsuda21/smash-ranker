import { useClient } from "urql";
import * as countryList from "country-list";
import { t } from "@lingui/core/macro";

import { graphql } from "@/gql";
import { useResultsStore } from "@/store/resultsStore";
import type {
  CharacterRef,
  PlayerRanking,
  PlayerSet,
  PlayerTournamentResults,
} from "@/types/results/PlayerTournamentResults";
import { logEvent, logWarning } from "@/utils/observability/log";
import { computeUpsetFactor } from "@/utils/results/upsetFactor";
import {
  filterAndSortRankings,
  getPlayerRankingOverrides,
  mergePlayerRankings,
} from "@/utils/results/playerRankings";

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

type SetRecord = { wins?: number; losses?: number } | null | undefined;

const parseSetRecord = (raw: unknown): { wins: number; losses: number } => {
  const record = raw as SetRecord;
  return {
    wins: typeof record?.wins === "number" ? record.wins : 0,
    losses: typeof record?.losses === "number" ? record.losses : 0,
  };
};

const parseDisplayScore = (
  raw: string | null | undefined,
): { scoreSelf: number; scoreOpponent: number; isDQ: boolean } => {
  if (!raw) return { scoreSelf: 0, scoreOpponent: 0, isDQ: false };
  if (/dq/i.test(raw)) return { scoreSelf: 0, scoreOpponent: 0, isDQ: true };
  const match = raw.match(/(-?\d+)\s*-\s*(-?\d+)/);
  if (!match) return { scoreSelf: 0, scoreOpponent: 0, isDQ: false };
  return {
    scoreSelf: parseInt(match[1], 10),
    scoreOpponent: parseInt(match[2], 10),
    isDQ: false,
  };
};

const resolveCountry = (raw: string | null | undefined): string | undefined => {
  if (!raw) return undefined;
  const code = countryList.getCode(raw);
  return code || undefined;
};

export const useFetchPlayerResults = () => {
  const client = useClient();
  const dispatch = useResultsStore((state) => state.dispatch);

  const fetchPlayerResults = async (entrantId: string) => {
    dispatch({ type: "FETCH_RESULTS_START" });

    // Read videogameId at call time (rather than capturing it via the
    // selector) so a slow fetch doesn't pin a stale value.
    const videogameId = useResultsStore.getState().videogameId;

    try {
      const result = await client
        .query(PlayerTournamentResultsQueryDoc, {
          entrantId,
          videogameId: videogameId ?? null,
          page: 1,
          perPage: 64,
        })
        .toPromise();

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
      const playerId = participant?.player?.id
        ? String(participant.player.id)
        : undefined;
      const rawRankings: PlayerRanking[] = (participant?.player?.rankings ?? [])
        .filter(
          (r): r is { rank: number; title: string } =>
            !!r &&
            typeof r.rank === "number" &&
            typeof r.title === "string" &&
            r.title.length > 0,
        )
        .map((r) => ({ rank: r.rank, title: r.title }));
      // Merge any per-player config overrides (e.g. drybie's EU PR which
      // isn't on start.gg) BEFORE filtering so they participate in the same
      // level + recency sort.
      const mergedRankings = mergePlayerRankings(
        rawRankings,
        getPlayerRankingOverrides(playerId),
      );
      const rankings = filterAndSortRankings(mergedRankings);
      const iconUrl =
        participant?.user?.images
          ?.find((img) => img?.type === "profile")
          ?.url?.replace("http://", "https://") || undefined;
      const seed = entrant.initialSeedNum ?? 9999;
      const placement = entrant.standing?.placement ?? 0;
      const record = parseSetRecord(entrant.standing?.setRecordWithoutByes);

      const setNodes = entrant.paginatedSets?.nodes ?? [];
      const sets: PlayerSet[] = [];
      // Some organizers misconfigure start.gg's `phaseOrder` (e.g. for
      // tournament/69-sp-1/event/1on1 TOP8 has phaseOrder=4 while the
      // qualifying TOP96 has phaseOrder=5, even though TOP96 is played
      // first). Derive a temporal key from per-set completedAt so the
      // actual playing order wins over the editor's UI ordering.
      const phaseTemporalKey = new Map<string, number>();

      for (const node of setNodes) {
        if (!node) continue;
        const slots = (node.slots ?? []).filter(Boolean);
        const selfSlot = slots.find(
          (s) => s?.entrant?.id && String(s.entrant.id) === String(entrantId),
        );
        const oppSlot = slots.find(
          (s) => s?.entrant?.id && String(s.entrant.id) !== String(entrantId),
        );
        if (!selfSlot?.entrant || !oppSlot?.entrant) continue;

        const oppEntrant = oppSlot.entrant;
        const oppParticipant = oppEntrant.participants?.[0];
        const oppName =
          oppParticipant?.gamerTag || oppEntrant.name || "Unknown";
        const oppRawRankings: PlayerRanking[] = (
          oppParticipant?.player?.rankings ?? []
        )
          .filter(
            (r): r is { rank: number; title: string } =>
              !!r &&
              typeof r.rank === "number" &&
              typeof r.title === "string" &&
              r.title.length > 0,
          )
          .map((r) => ({ rank: r.rank, title: r.title }));
        const oppPlayerId = oppParticipant?.player?.id
          ? String(oppParticipant.player.id)
          : undefined;
        const oppMerged = mergePlayerRankings(
          oppRawRankings,
          getPlayerRankingOverrides(oppPlayerId),
        );
        const oppTopRanking = filterAndSortRankings(oppMerged)[0];

        const { scoreSelf, scoreOpponent, isDQ } = parseDisplayScore(
          node.displayScore,
        );

        const didWin =
          node.winnerId != null && String(node.winnerId) === String(entrantId);

        const selfCharacters: CharacterRef[] = [];
        const oppCharacters: CharacterRef[] = [];
        const seenSelf = new Set<string>();
        const seenOpp = new Set<string>();

        for (const game of node.games ?? []) {
          for (const selection of game?.selections ?? []) {
            const character = selection?.character;
            if (!character?.id) continue;
            const charId = String(character.id);
            const charName = character.name || charId;
            const selectionEntrantId = selection?.entrant?.id
              ? String(selection.entrant.id)
              : null;
            if (selectionEntrantId === String(entrantId)) {
              if (!seenSelf.has(charId)) {
                seenSelf.add(charId);
                selfCharacters.push({ id: charId, name: charName });
              }
            } else if (selectionEntrantId === String(oppEntrant.id)) {
              if (!seenOpp.has(charId)) {
                seenOpp.add(charId);
                oppCharacters.push({ id: charId, name: charName });
              }
            }
          }
        }

        const phase = node.phaseGroup?.phase;
        const phaseId = phase?.id ? String(phase.id) : "unknown";
        const phaseName = phase?.name || "Other";
        const phaseOrder = phase?.phaseOrder ?? Number.MAX_SAFE_INTEGER;

        // Track the EARLIEST timestamp we see in each phase. completedAt is
        // populated even when startAt is null (which is common — most sets
        // never record a start-of-play timestamp), so prefer it.
        const setTs = node.completedAt ?? node.startAt;
        if (setTs != null) {
          const ms = setTs * 1000;
          const existing = phaseTemporalKey.get(phaseId);
          if (existing === undefined || ms < existing) {
            phaseTemporalKey.set(phaseId, ms);
          }
        }

        // Upset factor uses (winner_seed, loser_seed). DQs aren't competitive
        // upsets, so skip them. Use the raw nullable seed values rather than
        // the 9999 fallback so missing-seed sets register 0 (no badge).
        const rawSelfSeed = entrant.initialSeedNum ?? 0;
        const rawOppSeed = oppEntrant.initialSeedNum ?? 0;
        const upsetFactor =
          isDQ || !rawSelfSeed || !rawOppSeed
            ? 0
            : computeUpsetFactor(
                didWin ? rawSelfSeed : rawOppSeed,
                didWin ? rawOppSeed : rawSelfSeed,
              );

        sets.push({
          id: String(node.id),
          fullRoundText: node.fullRoundText || "",
          round: node.round ?? 0,
          scoreSelf,
          scoreOpponent,
          didWin,
          isDQ,
          startAtMs: node.startAt ? node.startAt * 1000 : undefined,
          upsetFactor: upsetFactor > 0 ? upsetFactor : undefined,
          phaseId,
          phaseName,
          phaseOrder,
          selfCharacters,
          opponent: {
            id: String(oppEntrant.id),
            playerId: oppParticipant?.player?.id
              ? String(oppParticipant.player.id)
              : undefined,
            name: oppName,
            prefix: oppParticipant?.prefix || undefined,
            country: resolveCountry(oppParticipant?.user?.location?.country),
            topRanking: oppTopRanking,
            seed: rawOppSeed || 9999,
            placement: oppEntrant.standing?.placement ?? 0,
            characters: oppCharacters,
          },
        });
      }

      // sortType: RECENT returns newest-completed first; flip so within a
      // phase the sets land in chronological-oldest-first order (a stable
      // sort below then keeps that intra-phase order intact).
      sets.reverse();
      // Cross-phase order: prefer the temporal key (min completedAt per
      // phase) over phaseOrder. Falls back to phaseOrder only when neither
      // phase has any timestamped sets — rare in completed tournaments.
      sets.sort((a, b) => {
        if (a.phaseId === b.phaseId) return 0;
        const aKey = phaseTemporalKey.get(a.phaseId);
        const bKey = phaseTemporalKey.get(b.phaseId);
        if (aKey != null && bKey != null) return aKey - bKey;
        return a.phaseOrder - b.phaseOrder;
      });

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
      const message =
        error instanceof Error
          ? error.message
          : t`Failed to fetch player results`;
      logWarning("results player-fetch failed", {
        area: "results-fetch",
        entrantId,
        error: message,
      });
      dispatch({ type: "FETCH_RESULTS_FAIL", payload: message });
      logEvent("results_fetch_fail", {
        tournament_platform: "startgg",
        stage: "player",
      });
    }
  };

  return { fetchPlayerResults };
};
