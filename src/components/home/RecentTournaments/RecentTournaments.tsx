import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import {
  RecentTournamentsShell,
  RecentTournamentsSkeleton,
} from "@/components/home/RecentTournaments/RecentTournamentsShell";
import {
  EventActions,
  EventRow,
  PlacementChip,
  TournamentIcon,
  TournamentLink,
} from "@/components/user/EventRow/EventRow";
import { useEventMeta } from "@/hooks/user/useEventMeta";
import { RECENT_LIST_LENGTH } from "@/consts/home";
import { useUserEvents } from "@/hooks/user/useUserEvents";
import type { UserEvent } from "@/types/user/UserEvent";
import { observeTournamentsHeight } from "@/utils/home/tournamentsHeight";
import { expectedPlacement } from "@/utils/user/careerStats";
import { formatOrdinal } from "@/utils/user/ordinal";

import styles from "./RecentTournaments.module.scss";

// Enough to find the latest finished event past a few upcoming
// registrations, and still show a short list under it.
const RECENT_COUNT = 8;

// The featured tournament's result in numbers. Desktop only: there the card
// is as tall as the list beside it and has the room.
const FeaturedStats = ({ event }: { event: UserEvent }) => {
  const { i18n } = useLingui();
  const { placement, seed, numEntrants } = event;
  if (placement === null) return null;

  const topPercent =
    numEntrants > 0
      ? Math.max(1, Math.ceil((placement / numEntrants) * 100))
      : null;
  const projected = seed === null ? null : expectedPlacement(seed);

  return (
    <dl className={styles.stats}>
      <div className={styles.stat}>
        <dt>
          <Trans>Placement</Trans>
        </dt>
        <dd>{formatOrdinal(placement, i18n.locale)}</dd>
        {numEntrants > 0 && (
          <dd className={styles.statNote}>
            <Trans>of {numEntrants} entrants</Trans>
          </dd>
        )}
      </div>
      {seed !== null && projected !== null && (
        <div className={styles.stat}>
          <dt>
            <Trans>Seed</Trans>
          </dt>
          <dd>{seed}</dd>
          <dd className={styles.statNote}>
            {placement < projected ? (
              <Trans>Beat your seed</Trans>
            ) : placement === projected ? (
              <Trans>Finished on seed</Trans>
            ) : (
              <Trans>Below your seed</Trans>
            )}
          </dd>
        </div>
      )}
      {topPercent !== null && (
        <div className={styles.stat}>
          <dt>
            <Trans>Finish</Trans>
          </dt>
          <dd>
            <Trans>Top {topPercent}%</Trans>
          </dd>
          <dd className={styles.statNote}>
            <Trans>of the bracket</Trans>
          </dd>
        </div>
      )}
    </dl>
  );
};

// Logged-in home page: the user's latest tournament, ready to turn into a
// graphic, and the few before it.
export const RecentTournaments = () => {
  const { events, status } = useUserEvents({
    perPage: RECENT_COUNT,
    maxPages: 1,
  });
  const eventMeta = useEventMeta();

  const now = Date.now();
  const past = events.filter((e) => e.startAt === null || e.startAt <= now);
  const upcoming = events.filter((e) => e.startAt !== null && e.startAt > now);
  const featured = past[0];
  // The soonest upcoming event (the list is newest first).
  const next = upcoming[upcoming.length - 1];
  const rest = [...(next ? [next] : []), ...past.slice(1)].slice(
    0,
    RECENT_LIST_LENGTH,
  );

  if (status === "loading" && events.length === 0) {
    return <RecentTournamentsSkeleton />;
  }

  return (
    <RecentTournamentsShell
      busy={status === "loading"}
      showAllLink={events.length > 0}
    >
      {status === "error" && events.length === 0 && (
        <p className={styles.note}>
          <Trans>
            Couldn't reach start.gg for your tournaments. Try again in a bit.
          </Trans>
        </p>
      )}

      {status === "done" && events.length === 0 && (
        <p className={styles.note}>
          <Trans>
            No tournaments on your start.gg account yet. Once you enter one it
            shows up here.
          </Trans>
        </p>
      )}

      {featured && (
        <div
          ref={observeTournamentsHeight}
          className={cn(styles.body, rest.length > 0 && styles.bodySplit)}
        >
          <article
            className={cn(
              styles.featured,
              featured.placement !== null && styles.hasStats,
            )}
          >
            <span className={styles.featuredLabel}>
              <Trans>Latest</Trans>
            </span>
            <div className={styles.featuredHead}>
              <TournamentIcon event={featured} size={56} />
              <div className={styles.featuredText}>
                <h3 className={styles.featuredName}>
                  <TournamentLink event={featured} source="home" />
                </h3>
                <p className={styles.featuredMeta}>{eventMeta(featured)}</p>
              </div>
              <PlacementChip event={featured} className={styles.featuredChip} />
            </div>
            <FeaturedStats event={featured} />
            <EventActions event={featured} size="lg" source="home" />
          </article>

          {rest.length > 0 && (
            <ul className={styles.list}>
              {rest.map((event, i) => (
                <EventRow
                  key={event.id}
                  event={event}
                  source="home"
                  className={styles.listRow}
                  style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </RecentTournamentsShell>
  );
};
