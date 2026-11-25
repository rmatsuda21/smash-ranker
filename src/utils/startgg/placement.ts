// While an event is being played, start.gg's placement for someone still in
// it is the worst they can finish ("2nd" for both grand finalists, 1025th for
// everyone before round 1), with `isFinal` false. A finished event leaves
// `isFinal` false on some standings for good, so its state counts too.
type RawStanding =
  { placement?: number | null; isFinal?: boolean | null } | null | undefined;

export const isEventCompleted = (state: unknown): boolean =>
  state === "COMPLETED";

/** A placement that can no longer change, or null. */
export const finalPlacement = (
  standing: RawStanding,
  eventState: unknown,
): number | null =>
  standing?.placement && (standing.isFinal || isEventCompleted(eventState))
    ? standing.placement
    : null;
