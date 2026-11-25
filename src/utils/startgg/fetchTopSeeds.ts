import type { Client } from "urql";
import { t } from "@lingui/core/macro";

import { graphql } from "@/gql";
import type { EventTopSeedsQuery } from "@/gql/graphql";
import { startggLoadError } from "@/utils/startgg/describeError";

// The same player fields as the ranker's standings query, so either can fill
// a slot. A seed is at most 11 objects (a team of two): 64 stay under
// start.gg's 1000.
const EventTopSeedsQueryDoc = graphql(`
  query EventTopSeeds($phaseId: ID!, $perPage: Int!) {
    phase(id: $phaseId) {
      id
      seeds(query: { page: 1, perPage: $perPage }) {
        nodes {
          seedNum
          entrant {
            id
            name
            initialSeedNum
            standing {
              placement
              isFinal
            }
            participants {
              id
              gamerTag
              prefix
              user {
                id
                authorizations(types: [TWITTER]) {
                  id
                  externalId
                  externalUsername
                }
                location {
                  country
                  countryId
                }
              }
            }
          }
        }
      }
    }
  }
`);

export const MAX_TOP_SEEDS = 64;

type SeedNode = NonNullable<
  NonNullable<
    NonNullable<NonNullable<EventTopSeedsQuery["phase"]>["seeds"]>["nodes"]
  >[number]
>;
export type TopSeed = SeedNode & { entrant: NonNullable<SeedNode["entrant"]> };

type PhaseSummary = {
  id?: string | number | null;
  numSeeds?: number | null;
} | null;

/**
 * The event's first `count` seeds, best first. Empty when it has no seeding:
 * organizers often open registration long before they make a bracket, and
 * until then the event has no phases at all.
 */
export const fetchTopSeeds = async (
  client: Client,
  phases: PhaseSummary[],
  count: number,
): Promise<TopSeed[]> => {
  // The phase holding everyone has the most seeds; `phaseOrder` does not
  // tell (see CLAUDE.md).
  const [phase] = phases
    .filter((candidate) => candidate?.id && candidate.numSeeds)
    .sort((a, b) => (b?.numSeeds ?? 0) - (a?.numSeeds ?? 0));
  if (!phase) return [];

  const result = await client
    .query(EventTopSeedsQueryDoc, {
      phaseId: String(phase.id),
      perPage: Math.min(count, MAX_TOP_SEEDS),
    })
    .toPromise();
  const seeds = result.data?.phase?.seeds;
  if (result.error || !seeds) {
    throw startggLoadError(result.error, t`Failed to fetch seeds`);
  }

  return (seeds.nodes ?? [])
    .filter((seed): seed is TopSeed => Boolean(seed?.entrant?.id))
    .sort((a, b) => (a.seedNum ?? Infinity) - (b.seedNum ?? Infinity));
};
