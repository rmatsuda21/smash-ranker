import { t } from "@lingui/core/macro";

import { slugToUrl } from "@/consts/platforms";
import type {
  HiveeEntrant,
  HiveeEvent,
  HiveeMatch,
  HiveeResolvedUrl,
  HiveeStandings,
} from "@/types/hivee/Hivee";

// Hivee's API is read-only, needs no key for public events and allows
// browsers (CORS), so it is called directly: there is no proxy function.
// Without a key the limit is 60 requests a minute per IP address.
const HIVEE_API = "https://hivee.jp/api/v1";

export const HIVEE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Page<T> = { data: T; next_cursor?: string | null };

const get = async <T>(path: string): Promise<Page<T>> => {
  const res = await fetch(`${HIVEE_API}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (res.ok) return res.json();

  // A private or draft event is answered as 404 too.
  if (res.status === 404) throw new Error(t`Tournament not found`);
  if (res.status === 429) {
    throw new Error(t`Hivee is receiving too many requests. Try again soon.`);
  }
  throw new Error(t`Hivee API error: ${res.status}`);
};

// Every page of a list endpoint.
const getAll = async <T>(path: string): Promise<T[]> => {
  const items: T[] = [];
  let cursor: string | null | undefined;
  do {
    const separator = path.includes("?") ? "&" : "?";
    const page = await get<T[]>(
      cursor ? `${path}${separator}cursor=${encodeURIComponent(cursor)}` : path,
    );
    items.push(...page.data);
    cursor = page.next_cursor;
  } while (cursor);
  return items;
};

export type HiveeIds = { eventId: string; programId?: string };

// A slug is "<event id or short URL name>" or that plus "/<program id>".
// A short URL name is turned into the event's id by Hivee.
export const resolveHiveeSlug = async (slug: string): Promise<HiveeIds> => {
  const [eventKey, programId] = slug.split("/");
  if (HIVEE_UUID.test(eventKey)) return { eventId: eventKey, programId };

  const url = slugToUrl("hivee", slug);
  const { data } = await get<HiveeResolvedUrl>(
    `/resolve?url=${encodeURIComponent(url)}`,
  );
  if (data.type !== "event") throw new Error(t`Tournament not found`);
  return {
    eventId: data.event_id,
    programId: data.program_id ?? programId,
  };
};

export const fetchHiveeEvent = async (eventId: string): Promise<HiveeEvent> =>
  (await get<HiveeEvent>(`/events/${eventId}`)).data;

export const fetchHiveeStandings = async (
  programId: string,
): Promise<HiveeStandings> =>
  (await get<HiveeStandings>(`/programs/${programId}/standings`)).data;

export const fetchHiveeEntrants = (eventId: string): Promise<HiveeEntrant[]> =>
  getAll<HiveeEntrant>(`/events/${eventId}/entrants`);

export const fetchHiveeCompletedMatches = (
  eventId: string,
): Promise<HiveeMatch[]> =>
  getAll<HiveeMatch>(`/events/${eventId}/matches?state=completed`);
