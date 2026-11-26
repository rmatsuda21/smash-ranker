import { useState } from "react";
import { Link } from "wouter";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { FaClipboardList, FaListOl, FaTrophy } from "react-icons/fa6";

import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { useEventMeta } from "@/hooks/user/useEventMeta";
import type { UserEvent } from "@/types/user/UserEvent";
import { formatOrdinal } from "@/utils/user/ordinal";
import {
  logToolLinkClick,
  type ToolLinkSource,
} from "@/utils/analytics/toolLinkClick";
import {
  predictLink,
  rankerLink,
  recapLink,
  tournamentLink,
} from "@/utils/user/toolLinks";

import styles from "./EventRow.module.scss";

// The tools an event can be opened in. An event still to come can only be
// predicted; a finished one has a Top 8 and the user's own run.
export const EventActions = ({
  event,
  size = "sm",
  source = "profile",
}: {
  event: UserEvent;
  size?: "sm" | "lg";
  // The page the links are on, for analytics.
  source?: ToolLinkSource;
}) => {
  const resultsEnabled = useFeatureFlag("results-enabled");
  const isUpcoming = event.startAt !== null && event.startAt > Date.now();

  return (
    <div className={cn(styles.actions, styles[size])}>
      {isUpcoming ? (
        <Link
          className={styles.action}
          href={predictLink(event.slug)}
          onClick={() => logToolLinkClick("predict", source)}
        >
          <FaListOl aria-hidden="true" />
          <Trans>Predict</Trans>
        </Link>
      ) : (
        <>
          <Link
            className={cn(styles.action, styles.primary)}
            href={rankerLink(event.slug)}
            onClick={() => logToolLinkClick("ranker", source)}
          >
            <FaTrophy aria-hidden="true" />
            <Trans>Top 8 graphic</Trans>
          </Link>
          {resultsEnabled && event.entrantId && (
            <Link
              className={styles.action}
              href={recapLink(event.slug, event.entrantId)}
              onClick={() => logToolLinkClick("recap", source)}
            >
              <FaClipboardList aria-hidden="true" />
              <Trans>My recap</Trans>
            </Link>
          )}
        </>
      )}
    </div>
  );
};

export const PlacementChip = ({
  event,
  className,
}: {
  event: UserEvent;
  className?: string;
}) => {
  const { i18n } = useLingui();
  if (event.startAt !== null && event.startAt > Date.now()) {
    return (
      <span className={cn(styles.placement, styles.upcoming, className)}>
        <Trans>Upcoming</Trans>
      </span>
    );
  }
  if (event.placement === null) return null;
  return (
    <span
      className={cn(styles.placement, className, {
        [styles.gold]: event.placement === 1,
        [styles.silver]: event.placement === 2,
        [styles.bronze]: event.placement === 3,
      })}
    >
      <strong>{formatOrdinal(event.placement, i18n.locale)}</strong>
      {event.numEntrants > 0 && (
        <span className={styles.outOf}>/ {event.numEntrants}</span>
      )}
    </span>
  );
};

export const TournamentIcon = ({
  event,
  size = 40,
}: {
  event: UserEvent;
  size?: number;
}) => {
  // The icon is requested in CORS mode, the way the ranker later fetches the
  // same file: a copy cached without CORS headers would make that fetch
  // fail. If the browser already holds such a copy (from a page that showed
  // the icon as a plain image), the CORS request fails instead, so fall back
  // to a plain request.
  const [useCors, setUseCors] = useState(true);

  return (
    <span
      className={styles.icon}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {event.tournament.iconUrl ? (
        <img
          key={String(useCors)}
          src={event.tournament.iconUrl}
          alt=""
          loading="lazy"
          crossOrigin={useCors ? "anonymous" : undefined}
          onError={() => setUseCors(false)}
        />
      ) : (
        <FaTrophy />
      )}
    </span>
  );
};

// The tournament's name, leading to its page opened on this event.
export const TournamentLink = ({
  event,
  source = "profile",
}: {
  event: UserEvent;
  source?: ToolLinkSource;
}) => (
  <Link
    className={styles.nameLink}
    href={tournamentLink(event.tournament.id, event.id)}
    onClick={() => logToolLinkClick("tournament", source)}
  >
    {event.tournament.name}
  </Link>
);

type Props = {
  event: UserEvent;
  // Buttons under the text at every width, for a list in a narrow column.
  stacked?: boolean;
  source?: ToolLinkSource;
  className?: string;
  style?: React.CSSProperties;
};

export const EventRow = ({
  event,
  stacked,
  source = "profile",
  className,
  style,
}: Props) => {
  const eventMeta = useEventMeta();

  return (
    <li
      className={cn(styles.row, stacked && styles.stacked, className)}
      style={style}
    >
      <TournamentIcon event={event} />
      <div className={styles.text}>
        <p className={styles.name}>
          <TournamentLink event={event} source={source} />
        </p>
        <p className={styles.meta}>{eventMeta(event)}</p>
      </div>
      <PlacementChip event={event} className={styles.rowPlacement} />
      <EventActions event={event} source={source} />
    </li>
  );
};
