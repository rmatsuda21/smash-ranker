import type { HiveeEvent } from "@/types/hivee/Hivee";

// Hivee gives times in UTC and no timezone. It is a Japanese service, so an
// event in Japan, or with no country (online, venue undecided), is on Japan
// time. Null for an event somewhere else: its days are then the viewer's.
export const hiveeTimezone = (
  event: Pick<HiveeEvent, "country">,
): string | null =>
  event.country === null || event.country === "jp" ? "Asia/Tokyo" : null;

// The event's start for the tools, which keep a date as an ISO string and
// show its day in the viewer's timezone: noon, viewer's time, on the day the
// event starts where it is held. An event at 13:30 on the 23rd in Tokyo is
// still the 22nd in New York, and would be dated the 22nd on a graphic.
// "" when Hivee has no start time.
export const hiveeEventDate = (
  event: Pick<HiveeEvent, "country" | "starts_at">,
): string => {
  const start = new Date(event.starts_at ?? "");
  if (Number.isNaN(start.getTime())) return "";
  const timeZone = hiveeTimezone(event);
  if (!timeZone) return start.toISOString();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(start);
  const part = (type: string) =>
    Number(parts.find((entry) => entry.type === type)?.value);
  return new Date(
    part("year"),
    part("month") - 1,
    part("day"),
    12,
  ).toISOString();
};
