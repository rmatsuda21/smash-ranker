import {
  lazy,
  Suspense,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useLocation } from "wouter";
import {
  FaArrowUpRightFromSquare,
  FaLocationDot,
  FaRightFromBracket,
} from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { GameSwitch } from "@/components/shared/GameSwitch/GameSwitch";
import { LoginPrompt } from "@/components/home/LoginPrompt/LoginPrompt";
import { EmptyProfile } from "@/components/user/EmptyProfile/EmptyProfile";
import { EventList } from "@/components/user/EventList/EventList";
import { StatsBoard } from "@/components/user/StatsBoard/StatsBoard";
import { UserAvatar } from "@/components/user/UserAvatar/UserAvatar";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useUserGameCounts } from "@/hooks/user/useUserGameCounts";
import { useUserEvents } from "@/hooks/user/useUserEvents";
import { useUserSets } from "@/hooks/user/useUserSets";
import { useScrollMemory } from "@/hooks/user/useScrollMemory";
import { useAuthUser } from "@/store/authStore";
import type { GameId } from "@/types/Game";
import { logout } from "@/utils/auth/session";
import { logEvent } from "@/utils/observability/log";
import {
  getPlayedGames,
  pickProfileGame,
  rememberProfileGame,
} from "@/utils/user/profileGame";
import {
  readUserPageMemory,
  writeUserPageMemory,
  type UserPageTab,
} from "@/utils/user/pageMemory";

import styles from "./UserPage.module.scss";

// 60 events is about 420 of start.gg's 1000-per-request complexity budget.
const EVENTS_PER_PAGE = 60;
// Up to 600 events: everything, for all but the most travelled players.
const MAX_EVENT_PAGES = 10;
// Three pages of sets (about 135) is enough for rivals and mains without
// walking a whole career of them.
const SET_PAGES = 3;

const PlayerCardLauncher = lazy(() =>
  import("@/components/user/PlayerCardLauncher/PlayerCardLauncher").then(
    (m) => ({ default: m.PlayerCardLauncher }),
  ),
);
// Matches the `wide` mixin: from here the list and the stats sit side by
// side; below it they are two tabs.
const WIDE_QUERY = "(min-width: 1024px)";

export const UserPage = () => {
  const { _ } = useLingui();
  const user = useAuthUser();
  const isWide = useMediaQuery(WIDE_QUERY);
  const [tab, setTab] = useState<UserPageTab>(
    () => readUserPageMemory().tab ?? "list",
  );
  const [, navigate] = useLocation();
  // Everything on the page is about one game. `chosen` is a pick made on
  // this visit; before one, it is the game the user last looked at (or, if
  // they have nothing in it, the one they play most).
  const gameCounts = useUserGameCounts();
  const [chosen, setChosen] = useState<GameId | null>(null);
  const game = chosen ?? pickProfileGame(gameCounts);
  const playedGames = getPlayedGames(gameCounts);

  const { events, total, status } = useUserEvents({
    game,
    perPage: EVENTS_PER_PAGE,
    maxPages: MAX_EVENT_PAGES,
  });
  // Sets are narrowed to the game through its events: the most recent page
  // of them holds far more sets than the stats read. Known as soon as that
  // page is in, and unchanged by the pages after it.
  const setEventIds = useMemo(
    () =>
      status === "idle" || (status === "loading" && events.length === 0)
        ? null
        : events
            .slice(0, EVENTS_PER_PAGE)
            .map((event) => event.id)
            .join(","),
    [status, events],
  );
  const { sets, status: setsStatus } = useUserSets(SET_PAGES, setEventIds);

  // The page is at its final height once the events are in and the set
  // tiles above the list have stopped loading.
  // On a wide screen the tournament list scrolls in its own pane.
  const rootRef = useRef<HTMLDivElement>(null);
  const listPaneRef = useRef<HTMLDivElement>(null);
  useScrollMemory(
    isWide ? listPaneRef : rootRef,
    (status === "done" || status === "error") && setsStatus !== "loading",
  );

  // Switching tabs from far down one pane should not land far down the
  // other: bring the top of the panes back under the (sticky) tab bar.
  const tabsRef = useRef<HTMLDivElement>(null);
  const panesRef = useRef<HTMLDivElement>(null);
  const shownTabRef = useRef(tab);
  useLayoutEffect(() => {
    if (shownTabRef.current === tab) return;
    shownTabRef.current = tab;
    const root = rootRef.current;
    const tabs = tabsRef.current;
    const panes = panesRef.current;
    if (!root || !tabs || !panes) return;
    const overshoot =
      tabs.getBoundingClientRect().bottom - panes.getBoundingClientRect().top;
    if (overshoot > 0) root.scrollTop -= overshoot;
  }, [tab]);

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

  // An account with nothing to show (or nothing loaded) has no panes.
  const isEmpty = status === "done" && events.length === 0;
  const isFailed = status === "error" && events.length === 0;
  const showList = isWide || tab === "list";
  // Mounted only while visible, so the numbers count up when the user gets
  // to them.
  const showStats = isWide || tab === "stats";

  const cardSlot = <span className={styles.cardSlot} aria-hidden="true" />;

  const selectGame = (next: GameId) => {
    setChosen(next);
    rememberProfileGame(next);
    // A different list: start it from the top.
    if (rootRef.current) rootRef.current.scrollTop = 0;
    if (listPaneRef.current) listPaneRef.current.scrollTop = 0;
  };

  const selectTab = (next: UserPageTab) => {
    setTab(next);
    writeUserPageMemory({ tab: next });
  };

  const handleLogout = () => {
    logEvent("user_logout", {});
    void logout();
    navigate("/");
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <div
        className={cn(styles.content, !isFailed && !isEmpty && styles.split)}
      >
        <header className={styles.header}>
          <div className={styles.avatarWrap}>
            <UserAvatar
              user={user}
              size={isWide ? 88 : 56}
              className={styles.avatar}
            />
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
          {/* Only for someone with events in more than one game. */}
          {playedGames.length > 1 && (
            <GameSwitch
              className={styles.gameSwitch}
              value={game}
              games={playedGames}
              onChange={selectGame}
            />
          )}

          {/* The player card, in miniature: it is drawn from the stats, so
              its place is held until they are in. */}
          {!isEmpty && !isFailed && (
            <Suspense fallback={cardSlot}>
              {eventsSettled && setsStatus !== "loading" ? (
                <PlayerCardLauncher
                  key={game}
                  user={user}
                  events={events}
                  sets={sets}
                  className={styles.cardSlot}
                />
              ) : (
                cardSlot
              )}
            </Suspense>
          )}
          <div className={styles.headerActions}>
            <a
              className={styles.profileLink}
              href={`https://start.gg/${user.slug}`}
              target="_blank"
              rel="noreferrer"
              aria-label={_(msg`start.gg profile`)}
            >
              <span className={styles.actionLabel}>
                <Trans>start.gg profile</Trans>
              </span>
              <FaArrowUpRightFromSquare aria-hidden="true" />
            </a>
            <Button
              className={styles.logout}
              variant="ghost"
              size="sm"
              aria-label={_(msg`Log out`)}
              onClick={handleLogout}
            >
              <FaRightFromBracket aria-hidden="true" />
              <span className={styles.actionLabel}>
                <Trans>Log out</Trans>
              </span>
            </Button>
          </div>
        </header>

        {isFailed ? (
          <p className={styles.error}>
            <Trans>
              Couldn't reach start.gg for your tournaments. Try again in a bit.
            </Trans>
          </p>
        ) : isEmpty ? (
          <EmptyProfile />
        ) : (
          <>
            {!isWide && (
              <div className={styles.tabs} role="tablist" ref={tabsRef}>
                <button
                  type="button"
                  role="tab"
                  id="user-tab-list"
                  aria-selected={tab === "list"}
                  aria-controls="user-pane-list"
                  className={cn(styles.tab, tab === "list" && styles.tabOn)}
                  onClick={() => selectTab("list")}
                >
                  <Trans>Tournaments</Trans>
                  {total > 0 && (
                    <span className={styles.tabCount}>{total}</span>
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  id="user-tab-stats"
                  aria-selected={tab === "stats"}
                  aria-controls="user-pane-stats"
                  className={cn(styles.tab, tab === "stats" && styles.tabOn)}
                  onClick={() => selectTab("stats")}
                >
                  <Trans>Stats</Trans>
                </button>
              </div>
            )}

            {/* Two columns that grow on their own: stats arriving later
                never push the tournaments down. */}
            <div className={styles.panes} ref={panesRef}>
              <div
                className={styles.listPane}
                ref={listPaneRef}
                id="user-pane-list"
                role={isWide ? undefined : "tabpanel"}
                aria-labelledby={isWide ? undefined : "user-tab-list"}
                hidden={!showList}
              >
                <EventList
                  events={events}
                  total={total}
                  loading={status === "loading"}
                />
              </div>

              {showStats && (
                <aside
                  className={styles.statsPane}
                  id="user-pane-stats"
                  role={isWide ? undefined : "tabpanel"}
                  aria-labelledby={isWide ? undefined : "user-tab-stats"}
                >
                  <h2 className={styles.paneTitle}>
                    <Trans>Your stats</Trans>
                  </h2>
                  {eventsSettled ? (
                    <StatsBoard
                      key={game}
                      events={events}
                      sets={sets}
                      setsLoading={setsStatus === "loading"}
                    />
                  ) : (
                    <div className={styles.statsSkeleton} aria-hidden="true">
                      {[...Array(7).keys()].map((i) => (
                        <span key={i} />
                      ))}
                    </div>
                  )}
                </aside>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
