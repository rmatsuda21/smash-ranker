import { PLATFORM_LABELS } from "@/consts/platforms";
import { useEffect, useState } from "react";
import cn from "classnames";
import { Link, useLocation, useSearch } from "wouter";
import { Plural, Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import {
  FaArrowUpRightFromSquare,
  FaCheck,
  FaLink,
  FaTrophy,
} from "react-icons/fa6";
import "@fontsource/big-shoulders-display/latin-800";
import "@fontsource/big-shoulders-display/latin-900";

import { Button } from "@/components/shared/Button/Button";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import {
  BracketTab,
  type BracketPick,
} from "@/components/tournament/BracketTab/BracketTab";
import { InfoTab } from "@/components/tournament/InfoTab/InfoTab";
import { OverviewTab } from "@/components/tournament/OverviewTab/OverviewTab";
import { StandingsTab } from "@/components/tournament/StandingsTab/StandingsTab";
import { useEventOverview } from "@/hooks/tournament/useEventOverview";
import { useTournament } from "@/hooks/tournament/useTournament";
import { useTournamentAddress } from "@/hooks/tournament/useTournamentAddress";
import type { LoadStatus } from "@/hooks/useCachedLoad";
import type {
  TournamentDetails,
  TournamentStatus,
} from "@/types/tournament/Tournament";
import { logEvent } from "@/utils/observability/log";
import { isTournamentSlug } from "@/utils/tournament/fetchTournament";
import {
  formatTournamentDates,
  formatTournamentPlace,
} from "@/utils/tournament/format";

import styles from "./TournamentPage.module.scss";

const TABS = ["overview", "standings", "bracket", "info"] as const;
export type TournamentTab = (typeof TABS)[number];

const TAB_LABELS = {
  overview: msg`Overview`,
  standings: msg`Standings`,
  bracket: msg`Bracket`,
  info: msg`Info`,
};

const STATUS_LABELS: Record<TournamentStatus, ReturnType<typeof msg>> = {
  upcoming: msg`Upcoming`,
  live: msg`Live`,
  finished: msg`Finished`,
};

// Events shown before "more": a major can have forty.
const EVENTS_SHOWN = 6;

const isTab = (value: string | null): value is TournamentTab =>
  TABS.includes(value as TournamentTab);

// The icon is requested in CORS mode, the way the ranker later fetches the
// same file (see `TournamentIcon` in EventRow), with a plain request as the
// fallback.
const Icon = ({ url }: { url: string | null }) => {
  const [useCors, setUseCors] = useState(true);
  return (
    <span className={styles.icon} aria-hidden="true">
      {url ? (
        <img
          key={String(useCors)}
          src={url}
          alt=""
          crossOrigin={useCors ? "anonymous" : undefined}
          onError={() => setUseCors(false)}
        />
      ) : (
        <FaTrophy />
      )}
    </span>
  );
};

const CopyLinkButton = () => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused (permissions, insecure origin): nothing to confirm.
    }
  };
  return (
    <button type="button" className={styles.action} onClick={copy}>
      {copied ? <FaCheck aria-hidden="true" /> : <FaLink aria-hidden="true" />}
      {copied ? <Trans>Copied</Trans> : <Trans>Copy link</Trans>}
    </button>
  );
};

const Loaded = ({ tournament }: { tournament: TournamentDetails }) => {
  const { _, i18n } = useLingui();
  const search = useSearch();
  const [, navigate] = useLocation();
  const [showAllEvents, setShowAllEvents] = useState(false);

  const params = new URLSearchParams(search);
  const event =
    tournament.events.find((e) => e.id === params.get("event")) ??
    tournament.events[0] ??
    null;
  const requestedTab = params.get("tab");
  // Without an event there is nothing to rank or draw: only the details.
  const tab: TournamentTab = !event
    ? "info"
    : isTab(requestedTab)
      ? requestedTab
      : "overview";

  // Tab, event and the bracket's phase and pool live in the address, so a
  // copied link opens the same view.
  const hrefWith = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    return `/tournament/${tournament.id}${query ? `?${query}` : ""}`;
  };
  const setParams = (changes: Record<string, string | null>) =>
    navigate(hrefWith(changes), { replace: true });
  // Another event's bracket starts where its grand final was played.
  const selectEvent = (id: string, changes: Record<string, string | null>) =>
    setParams({ event: id, phase: null, pool: null, ...changes });
  const bracketPick: BracketPick = {
    phaseId: params.get("phase"),
    groupId: params.get("pool"),
  };

  const overview = useEventOverview(event);

  // Once per tournament: `Loaded` is keyed by its id.
  useEffect(() => {
    logEvent("tournament_page_view", {
      tournament_platform: tournament.platform,
      has_event_param: new URLSearchParams(window.location.search).has("event"),
      event_count: tournament.events.length,
    });
  }, [tournament.platform, tournament.events.length]);

  const selectedIndex = event ? tournament.events.indexOf(event) : -1;
  const shownEvents =
    showAllEvents || tournament.events.length <= EVENTS_SHOWN + 1
      ? tournament.events
      : tournament.events.filter(
          (_event, index) => index < EVENTS_SHOWN || index === selectedIndex,
        );
  const hiddenCount = tournament.events.length - shownEvents.length;

  const dates = formatTournamentDates(tournament, i18n.locale);
  const place = formatTournamentPlace(tournament) ?? _(msg`Online`);

  return (
    <>
      <div
        className={styles.banner}
        style={
          tournament.bannerUrl
            ? { backgroundImage: `url("${tournament.bannerUrl}")` }
            : undefined
        }
      />
      <div className={styles.content}>
        <header className={styles.identity}>
          <Icon url={tournament.iconUrl} />
          <div className={styles.titleBlock}>
            <h1 className={styles.name}>{tournament.name}</h1>
            {/* The status leads the line under the name, so a name of any
                length leaves it in the same place. */}
            <p className={styles.meta}>
              <span className={cn(styles.status, styles[tournament.status])}>
                {_(STATUS_LABELS[tournament.status])}
              </span>
              {dates && <span>{dates}</span>}
              <span>{place}</span>
              {tournament.numAttendees > 0 && (
                <span>
                  <Plural
                    value={tournament.numAttendees}
                    one="# attendee"
                    other="# attendees"
                  />
                </span>
              )}
            </p>
          </div>
          <div className={styles.actions}>
            <CopyLinkButton />
            <a
              className={styles.action}
              href={tournament.url}
              target="_blank"
              rel="noreferrer"
            >
              {PLATFORM_LABELS[tournament.platform]}
              <FaArrowUpRightFromSquare aria-hidden="true" />
            </a>
          </div>
        </header>

        {tournament.events.length > 1 && (
          <div className={styles.events}>
            {shownEvents.map((e) => (
              <button
                key={e.id}
                type="button"
                className={cn(styles.event, e === event && styles.selected)}
                aria-pressed={e === event}
                onClick={() => selectEvent(e.id, {})}
              >
                {e.name}
                {e.numEntrants > 0 && (
                  <span className={styles.eventCount}>{e.numEntrants}</span>
                )}
              </button>
            ))}
            {hiddenCount > 0 && (
              <button
                type="button"
                className={styles.event}
                onClick={() => setShowAllEvents(true)}
              >
                <Trans>{hiddenCount} more</Trans>
              </button>
            )}
          </div>
        )}

        {event && (
          <div className={styles.tabs} role="tablist">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={cn(styles.tab, tab === id && styles.active)}
                onClick={() => {
                  if (id !== tab)
                    logEvent("tournament_tab_switch", { tab: id });
                  setParams({ tab: id === "overview" ? null : id });
                }}
              >
                {_(TAB_LABELS[id])}
              </button>
            ))}
          </div>
        )}

        <div className={styles.body} role="tabpanel">
          {event && tab === "overview" && (
            <OverviewTab
              tournament={tournament}
              event={event}
              overview={overview.data}
              status={overview.status}
              onRetry={overview.retry}
              onShowStandings={() => setParams({ tab: "standings" })}
              onShowBracket={() => setParams({ tab: "bracket" })}
            />
          )}
          {event && tab === "standings" && (
            <StandingsTab
              event={event}
              characters={overview.data?.characters ?? {}}
            />
          )}
          {event && tab === "bracket" && (
            // Keyed so another event's bracket starts afresh.
            <BracketTab
              key={event.id}
              event={event}
              overview={overview.data}
              overviewSettled={
                overview.status === "done" || overview.status === "error"
              }
              pick={bracketPick}
              onPick={({ phaseId, groupId }) =>
                setParams({ phase: phaseId, pool: groupId })
              }
              pickHref={({ phaseId, groupId }) =>
                hrefWith({ tab: "bracket", phase: phaseId, pool: groupId })
              }
            />
          )}
          {tab === "info" && (
            <InfoTab
              tournament={tournament}
              selectedEventId={event?.id ?? null}
              onSelectEvent={(id) => selectEvent(id, { tab: null })}
            />
          )}
        </div>
      </div>
    </>
  );
};

// Loading, or what is shown when there is no tournament to show.
const PageState = ({
  status,
  message,
  retry,
}: {
  status: LoadStatus;
  // The failure in its own words, when it has some (start.gg busy or down).
  message: string | null;
  retry: () => void;
}) =>
  status === "loading" || status === "idle" ? (
    <div className={styles.state}>
      <Spinner size={32} />
    </div>
  ) : (
    <div className={styles.state}>
      <h1 className={styles.stateTitle}>
        {status === "error" ? (
          <Trans>Couldn't load the tournament</Trans>
        ) : (
          <Trans>No tournament here</Trans>
        )}
      </h1>
      <p>
        {status === "error" ? (
          (message ?? <Trans>Check your connection and try again.</Trans>)
        ) : (
          <Trans>
            There is no tournament with this id. It may have been deleted or
            made private.
          </Trans>
        )}
      </p>
      {status === "error" && (
        <Button variant="solid" onClick={retry}>
          <Trans>Try again</Trans>
        </Button>
      )}
      <Link className={styles.action} href="/">
        <Trans>Back to home</Trans>
      </Link>
    </div>
  );

// start.gg's own address for a tournament ("/tournament/genesis-9", with
// "?event=ultimate-singles"), which the browser extension links to, is
// swapped for the page's own, with ids, before anything else loads.
const SlugRedirect = ({ slug }: { slug: string }) => {
  const search = useSearch();
  const [, navigate] = useLocation();
  const { data: address, status, message, retry } = useTournamentAddress(slug);

  useEffect(() => {
    if (!address) return;
    const params = new URLSearchParams(search);
    const event = params.get("event");
    if (event && address.eventIds[event]) {
      params.set("event", address.eventIds[event]);
    } else if (event && !/^\d+$/.test(event)) {
      params.delete("event");
    }
    const query = params.toString();
    navigate(`/tournament/${address.id}${query ? `?${query}` : ""}`, {
      replace: true,
    });
  }, [address, search, navigate]);

  return (
    <PageState
      status={address ? "loading" : status}
      message={message}
      retry={retry}
    />
  );
};

const ById = ({ id }: { id: string }) => {
  const { data: tournament, status, message, retry } = useTournament(id);
  return tournament ? (
    // Keyed so "more events" and scroll start fresh on another tournament.
    <Loaded key={tournament.id} tournament={tournament} />
  ) : (
    <PageState status={status} message={message} retry={retry} />
  );
};

export const TournamentPage = ({ id }: { id: string }) => (
  <div className={styles.root}>
    {isTournamentSlug(id) ? <SlugRedirect slug={id} /> : <ById id={id} />}
  </div>
);
