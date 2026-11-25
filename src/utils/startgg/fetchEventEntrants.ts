import type { Client } from "urql";
import * as countryList from "country-list";
import { t } from "@lingui/core/macro";

import { graphql } from "@/gql";
import { startggLoadError } from "@/utils/startgg/describeError";

export type EventEntrant = {
  id: string;
  name: string;
  prefix?: string;
  /** null when start.gg has no seed for the entrant yet. */
  seed: number | null;
  country?: string;
};

export type EventPhaseSummary = {
  id?: string | number | null;
  phaseOrder?: number | null;
  numSeeds?: number | null;
};

type FetchEventEntrantsArgs = {
  slug: string;
  phases: (EventPhaseSummary | null)[];
  numEntrants: number;
  /** Players per entrant (1 for singles); sets how many fit in a request. */
  rosterSize: number;
};

// start.gg refuses a request that returns more than 1000 objects. A seed costs
// one object for itself, one for its entrant and three for each participant
// (participant, user, location), so the page size follows from the roster
// size. Measured: 190 singles seeds cost 761.
const OBJECT_BUDGET = 900;
const MAX_PER_PAGE = 200;
// Pages go out together, a few at a time, to stay well inside start.gg's limit
// of 80 requests a minute even for events with thousands of entrants.
const MAX_CONCURRENT_PAGES = 8;

const PhaseSeedsPageQueryDoc = graphql(`
  query EventEntrantsPhaseSeeds($phaseId: ID!, $perPage: Int!, $page: Int!) {
    phase(id: $phaseId) {
      seeds(query: { page: $page, perPage: $perPage }) {
        pageInfo {
          totalPages
        }
        nodes {
          seedNum
          entrant {
            id
            name
            participants {
              gamerTag
              prefix
              user {
                location {
                  country
                }
              }
            }
          }
        }
      }
    }
  }
`);

const EventEntrantsPageQueryDoc = graphql(`
  query EventEntrantsPage($slug: String!, $perPage: Int!, $page: Int!) {
    event(slug: $slug) {
      entrants(query: { page: $page, perPage: $perPage }) {
        pageInfo {
          totalPages
        }
        nodes {
          id
          name
          initialSeedNum
          participants {
            gamerTag
            prefix
            user {
              location {
                country
              }
            }
          }
        }
      }
    }
  }
`);

type RawEntrant = {
  id?: string | number | null;
  name?: string | null;
  participants?:
    | ({
        gamerTag?: string | null;
        prefix?: string | null;
        user?: { location?: { country?: string | null } | null } | null;
      } | null)[]
    | null;
};

type Page = { totalPages: number; entrants: EventEntrant[] };

const toEntrant = (
  entrant: RawEntrant,
  seed: number | null | undefined,
): EventEntrant => {
  const participant = entrant.participants?.[0];
  const countryName = participant?.user?.location?.country;
  const countryCode = countryList.getCode(countryName ?? "");

  return {
    id: String(entrant.id),
    name: participant?.gamerTag || entrant.name || "Unknown",
    prefix: participant?.prefix || undefined,
    seed: seed ?? null,
    country: countryCode || undefined,
  };
};

const getPerPage = (rosterSize: number): number => {
  const objectsPerEntrant = 2 + 3 * Math.max(1, rosterSize);
  return Math.min(MAX_PER_PAGE, Math.floor(OBJECT_BUDGET / objectsPerEntrant));
};

/** Runs `fetchPage` for every page in `pages`, a few at a time. */
const fetchPages = async (
  pages: number[],
  fetchPage: (page: number) => Promise<Page>,
): Promise<Page[]> => {
  const results: Page[] = new Array(pages.length);
  let next = 0;

  const worker = async () => {
    while (next < pages.length) {
      const index = next++;
      results[index] = await fetchPage(pages[index]);
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(MAX_CONCURRENT_PAGES, pages.length) },
      worker,
    ),
  );
  return results;
};

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

/**
 * Fetches every page of a list whose size is roughly known up front: all the
 * expected pages at once, then any the count did not predict (late
 * registrations make the stored count lag behind the list).
 */
const fetchAllPages = async (
  expectedTotal: number,
  perPage: number,
  fetchPage: (page: number) => Promise<Page>,
): Promise<EventEntrant[]> => {
  const expectedPages = Math.max(1, Math.ceil(expectedTotal / perPage));
  const pages = await fetchPages(range(1, expectedPages), fetchPage);

  const actualPages = Math.max(...pages.map((page) => page.totalPages));
  if (actualPages > expectedPages) {
    pages.push(
      ...(await fetchPages(range(expectedPages + 1, actualPages), fetchPage)),
    );
  }

  // An entrant can show up on two pages if the list changes mid-fetch.
  const byId = new Map<string, EventEntrant>();
  for (const page of pages) {
    for (const entrant of page.entrants) byId.set(entrant.id, entrant);
  }
  return Array.from(byId.values());
};

/**
 * Every entrant of a start.gg event, in seed order, however many there are.
 *
 * The first phase's seed list is the fast source and is used whenever it holds
 * the whole event. When it does not (seeding not published yet, or entrants
 * placed straight into a later phase) the event's entrant list is read
 * instead, which is slower per page but always complete.
 */
export const fetchEventEntrants = async (
  client: Client,
  { slug, phases, numEntrants, rosterSize }: FetchEventEntrantsArgs,
): Promise<EventEntrant[]> => {
  const perPage = getPerPage(rosterSize);

  const firstPhase = phases
    .filter((phase): phase is EventPhaseSummary => Boolean(phase?.id))
    .sort((a, b) => (a.phaseOrder ?? 0) - (b.phaseOrder ?? 0))[0];
  const phaseSeeds = firstPhase?.numSeeds ?? 0;

  let entrants: EventEntrant[];

  if (firstPhase && phaseSeeds > 0 && phaseSeeds >= numEntrants) {
    const phaseId = String(firstPhase.id);
    entrants = await fetchAllPages(phaseSeeds, perPage, async (page) => {
      const result = await client
        .query(PhaseSeedsPageQueryDoc, { phaseId, perPage, page })
        .toPromise();
      const seeds = result.data?.phase?.seeds;
      if (result.error || !seeds) {
        throw startggLoadError(result.error, t`Failed to fetch seeds`);
      }
      return {
        totalPages: seeds.pageInfo?.totalPages ?? 1,
        entrants: (seeds.nodes ?? []).flatMap((node) =>
          node?.entrant ? [toEntrant(node.entrant, node.seedNum)] : [],
        ),
      };
    });
  } else {
    entrants = await fetchAllPages(numEntrants, perPage, async (page) => {
      const result = await client
        .query(EventEntrantsPageQueryDoc, { slug, perPage, page })
        .toPromise();
      const list = result.data?.event?.entrants;
      if (result.error || !list) {
        throw startggLoadError(result.error, t`Failed to fetch seeds`);
      }
      return {
        totalPages: list.pageInfo?.totalPages ?? 1,
        entrants: (list.nodes ?? []).flatMap((node) =>
          node ? [toEntrant(node, node.initialSeedNum)] : [],
        ),
      };
    });
  }

  // Unseeded entrants go last, in name order.
  return entrants.sort(
    (a, b) =>
      (a.seed ?? Infinity) - (b.seed ?? Infinity) ||
      (a.seed === null && b.seed === null ? a.name.localeCompare(b.name) : 0),
  );
};
