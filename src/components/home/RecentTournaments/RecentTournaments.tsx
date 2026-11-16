import { Link } from "wouter";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { FaArrowRight } from "react-icons/fa6";

import {
  EventActions,
  EventRow,
  PlacementChip,
  TournamentIcon,
} from "@/components/user/EventRow/EventRow";
import { useEventMeta } from "@/hooks/user/useEventMeta";
import { useUserEvents } from "@/hooks/user/useUserEvents";
import type { UserEvent } from "@/types/user/UserEvent";
import { expectedPlacement } from "@/utils/user/careerStats";
import { formatOrdinal } from "@/utils/user/ordinal";

import styles from "./RecentTournaments.module.scss";

// Enough to find the latest finished event past a few upcoming
// registrations, and still show a short list under it.
const RECENT_COUNT = 8;
const LIST_LENGTH = 3;

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
    LIST_LENGTH,
  );

  return (
    <section className={styles.root} aria-busy={status === "loading"}>
      <div className={styles.heading}>
        <h2 className={styles.sectionTitle}>
          <Trans>Your tournaments</Trans>
        </h2>
        {events.length > 0 && (
          <Link className={styles.allLink} href="/me">
            <Trans>All tournaments & stats</Trans>
            <FaArrowRight aria-hidden="true" />
          </Link>
        )}
      </div>

      {status === "loading" && events.length === 0 && (
        <div className={styles.skeletons} aria-hidden="true">
          <div className={styles.skeletonFeatured} />
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
        </div>
      )}

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
        <div className={cn(styles.body, rest.length > 0 && styles.bodySplit)}>
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
                  {featured.tournament.name}
                </h3>
                <p className={styles.featuredMeta}>{eventMeta(featured)}</p>
              </div>
              <PlacementChip event={featured} className={styles.featuredChip} />
            </div>
            <FeaturedStats event={featured} />
            <EventActions event={featured} size="lg" />
          </article>

          {rest.length > 0 && (
            <ul className={styles.list}>
              {rest.map((event, i) => (
                <EventRow
                  key={event.id}
                  event={event}
                  className={styles.listRow}
                  style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};
