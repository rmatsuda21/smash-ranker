import { useRef } from "react";
import { Trans } from "@lingui/react/macro";
import { useLocation } from "wouter";
import {
  FaArrowUpRightFromSquare,
  FaLocationDot,
  FaRightFromBracket,
} from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { LoginPrompt } from "@/components/home/LoginPrompt/LoginPrompt";
import { EmptyProfile } from "@/components/user/EmptyProfile/EmptyProfile";
import { EventList } from "@/components/user/EventList/EventList";
import { StatsBoard } from "@/components/user/StatsBoard/StatsBoard";
import { UserAvatar } from "@/components/user/UserAvatar/UserAvatar";
import { useUserEvents } from "@/hooks/user/useUserEvents";
import { useUserSets } from "@/hooks/user/useUserSets";
import { useScrollMemory } from "@/hooks/user/useScrollMemory";
import { useAuthUser } from "@/store/authStore";
import { logout } from "@/utils/auth/session";
import { logEvent } from "@/utils/observability/log";

import styles from "./UserPage.module.scss";

// 60 events is about 420 of start.gg's 1000-per-request complexity budget.
const EVENTS_PER_PAGE = 60;
// Up to 600 events: everything, for all but the most travelled players.
const MAX_EVENT_PAGES = 10;
// Three pages of sets (about 135) is enough for rivals and mains without
// walking a whole career of them.
const SET_PAGES = 3;

export const UserPage = () => {
  const user = useAuthUser();
  const [, navigate] = useLocation();
  const { events, total, status } = useUserEvents({
    perPage: EVENTS_PER_PAGE,
    maxPages: MAX_EVENT_PAGES,
  });
  const { sets, status: setsStatus } = useUserSets(SET_PAGES);

  // The page is at its final height once the events are in and the set
  // tiles above the list have stopped loading.
  const rootRef = useRef<HTMLDivElement>(null);
  useScrollMemory(
    rootRef,
    (status === "done" || status === "error") && setsStatus !== "loading",
  );

  if (!user) {
    return (
      <div className={styles.signedOut}>
        <h1 className={styles.signedOutTitle}>
          <Trans>Your tournaments, in one place</Trans>
        </h1>
        <p className={styles.signedOutText}>
          <Trans>
            Log in with start.gg to see every tournament you've entered and make
            graphics for them in one click.
          </Trans>
        </p>
        <LoginPrompt returnTo="/me" />
      </div>
    );
  }

  const place = [user.city, user.state, user.country]
    .filter(Boolean)
    .join(", ");
  const eventsSettled = status === "done" || status === "error";

  const handleLogout = () => {
    logEvent("user_logout", {});
    void logout();
    navigate("/");
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.avatarWrap}>
            <UserAvatar user={user} size={88} className={styles.avatar} />
          </div>
          <div className={styles.identity}>
            <h1 className={styles.tag}>
              {user.prefix && (
                <span className={styles.prefix}>{user.prefix}</span>
              )}
              {user.gamerTag}
            </h1>
            <p className={styles.details}>
              {user.name && <span>{user.name}</span>}
              {place && (
                <span>
                  <FaLocationDot aria-hidden="true" />
                  {place}
                </span>
              )}
            </p>
          </div>
          <div className={styles.headerActions}>
            <a
              className={styles.profileLink}
              href={`https://start.gg/${user.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              <Trans>start.gg profile</Trans>
              <FaArrowUpRightFromSquare aria-hidden="true" />
            </a>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <FaRightFromBracket aria-hidden="true" />
              <Trans>Log out</Trans>
            </Button>
          </div>
        </header>

        {eventsSettled && events.length > 0 ? (
          <StatsBoard
            events={events}
            sets={sets}
            setsLoading={setsStatus === "loading"}
          />
        ) : (
          !eventsSettled && (
            <div className={styles.statsSkeleton} aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} />
              ))}
            </div>
          )
        )}

        {status === "error" && events.length === 0 ? (
          <p className={styles.error}>
            <Trans>
              Couldn't reach start.gg for your tournaments. Try again in a bit.
            </Trans>
          </p>
        ) : status === "done" && events.length === 0 ? (
          <EmptyProfile />
        ) : (
          <EventList
            events={events}
            total={total}
            loading={status === "loading"}
          />
        )}
      </div>
    </div>
  );
};
