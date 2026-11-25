import { t } from "@lingui/core/macro";

import type { LineupSource } from "@/types/top8/Player";

/** What to tell the user about players that are not an event's final
 *  placements; null when they are. */
export const getLineupNotice = (lineup: LineupSource): string | null => {
  switch (lineup) {
    case "live":
      return t`This event isn't finished. Placements can still change: load it again to update them.`;
    case "seeds":
      return t`This event has no results yet. Players are in seed order: load it again once it's played.`;
    case "entrants":
      return t`This event has no results yet. Players are in entry order: load it again once it's played.`;
    case "none":
      return t`This event has no results or seeding yet. Its details are loaded and the players are blank.`;
    case "final":
      return null;
  }
};
