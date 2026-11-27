import { useState } from "react";
import cn from "classnames";
import { Link } from "wouter";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import {
  FaArrowRight,
  FaArrowUpRightFromSquare,
  FaClipboardList,
  FaListOl,
  FaTrophy,
} from "react-icons/fa6";

import {
  CharacterIcons,
  EntrantName,
  LoadFailed,
  Panel,
  SeedDelta,
  SkeletonRows,
} from "@/components/tournament/TournamentParts/TournamentParts";
import { UserAvatar } from "@/components/user/UserAvatar/UserAvatar";
import type { LoadStatus } from "@/hooks/useCachedLoad";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { useEventUpsets } from "@/hooks/tournament/useEventUpsets";
import type {
  EventOverview,
  StandingEntry,
  TournamentDetails,
  TournamentEvent,
} from "@/types/tournament/Tournament";
import { getCharacter } from "@/utils/top8/characterCatalog";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { UPSET_SEED_COUNT } from "@/utils/tournament/fetchEvent";
import { mapsLink } from "@/utils/tournament/format";
import { formatOrdinal } from "@/utils/user/ordinal";
import { logToolLinkClick } from "@/utils/analytics/toolLinkClick";
import { predictLink, rankerLink, recapLink } from "@/utils/user/toolLinks";

import styles from "./OverviewTab.module.scss";

const UPSETS_SHOWN = 3;
const UPSETS_EXPANDED = 12;

type Props = {
  tournament: TournamentDetails;
  event: TournamentEvent;
  overview: EventOverview | null;
  status: LoadStatus;
  // Loads the overview again after it failed.
  onRetry: () => void;
  onShowStandings: () => void;
  onShowBracket: () => void;
};

// One of the top three, with the character they played standing over the
// name. Without a known character the card is the name alone.
const PodiumCard = ({
  entry,
  event,
  characters,
}: {
  entry: StandingEntry;
  event: TournamentEvent;
  characters: string[] | undefined;
}) => {
  const character = characters?.[0];
  const first = entry.placement === 1;
  const characterNames = characters
    ?.slice(0, event.isTeams ? 2 : 1)
    .map((id) => getCharacter(id)?.name)
    .filter(Boolean)
    .join(" / ");
  return (
    <article className={cn(styles.pod, first && styles.first)}>
      {character && (
        <div className={styles.art}>
          <img
            src={getCharImgUrl({ characterId: character, type: "main" })}
            alt={getCharacter(character)?.name ?? ""}
          />
        </div>
      )}
      <div className={styles.podText}>
        <div className={styles.podHead}>
          <span className={styles.podPlace}>{entry.placement}</span>
          <span className={styles.podAvatars}>
            {entry.members.map((member, index) => (
              <UserAvatar
                key={index}
                user={{ avatarUrl: member.avatarUrl, gamerTag: member.tag }}
                size={first ? 48 : 40}
              />
            ))}
          </span>
        </div>
        <p className={styles.podName}>
          <EntrantName prefix={entry.prefix} tag={entry.tag} />
        </p>
        <p className={styles.podMeta}>
          {characterNames && <span>{characterNames}</span>}
          {entry.seed !== null && (
            <span>
              <Trans>Seed {entry.seed}</Trans>
            </span>
          )}
        </p>
      </div>
    </article>
  );
};

const Upsets = ({
  event,
  seedPhaseId,
}: {
  event: TournamentEvent;
  seedPhaseId: string | null;
}) => {
  const {
    data: upsets,
    status,
    message,
    retry,
  } = useEventUpsets(event, seedPhaseId);
  const [expanded, setExpanded] = useState(false);

  // No upsets is nothing to show; a failed load is not the same thing.
  if (upsets && upsets.length === 0) return null;
  if (status === "error") {
    return (
      <Panel className={styles.upsets} title={<Trans>Biggest upsets</Trans>}>
        <LoadFailed
          className={styles.panelFailed}
          message={message}
          onRetry={retry}
        />
      </Panel>
    );
  }
  const shown = upsets?.slice(0, expanded ? UPSETS_EXPANDED : UPSETS_SHOWN);
  const canExpand = !expanded && (upsets?.length ?? 0) > UPSETS_SHOWN;
  // Round names repeat from phase to phase ("Winners Round 1" in pools and
  // again in the top 64), so the phase is named when the upsets come from
  // more than one. An event with a single phase has nothing to tell apart.
  const showPhase =
    new Set((upsets ?? []).map((upset) => upset.phaseName)).size > 1;

  return (
    <Panel
      className={styles.upsets}
      title={<Trans>Biggest upsets</Trans>}
      aside={
        event.numEntrants > UPSET_SEED_COUNT ? (
          <Trans>Against the top {UPSET_SEED_COUNT} seeds</Trans>
        ) : undefined
      }
    >
      {!shown ? (
        <SkeletonRows count={UPSETS_SHOWN} />
      ) : (
        <ul className={styles.rows}>
          {shown.map((upset) => (
            <li key={upset.id} className={styles.row}>
              <span className={styles.factor}>UF {upset.upsetFactor}</span>
              <span className={styles.upsetText}>
                <span className={styles.upsetNames}>
                  <Trans>
                    {upset.winner.name}{" "}
                    <span className={styles.seed}>({upset.winner.seed})</span>{" "}
                    beat {upset.loser.name}{" "}
                    <span className={styles.seed}>({upset.loser.seed})</span>
                  </Trans>
                </span>
                <span className={styles.upsetMeta}>
                  {[
                    upset.winner.score !== null && upset.loser.score !== null
                      ? `${upset.winner.score}–${upset.loser.score}`
                      : null,
                    showPhase ? upset.phaseName : null,
                    upset.roundName,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {canExpand && (
        <button
          type="button"
          className={styles.more}
          onClick={() => setExpanded(true)}
        >
          <Trans>Show more upsets</Trans>
        </button>
      )}
    </Panel>
  );
};

export const OverviewTab = ({
  tournament,
  event,
  overview,
  status,
  onRetry,
  onShowStandings,
  onShowBracket,
}: Props) => {
  const { i18n } = useLingui();
  const resultsEnabled = useFeatureFlag("results-enabled");

  const standings = overview?.standings ?? [];
  // A podium is for a decided top three: while the event is played the first
  // placements are still open (two entrants in 2nd, nobody in 1st).
  const topThree = standings.slice(0, 3);
  const podium =
    topThree[0]?.placement === 1 && topThree.every((entry) => entry.isFinal)
      ? topThree
      : [];
  const run = overview?.userRun ?? null;
  const upcoming = event.status === "upcoming";
  const canRecap = resultsEnabled && event.game !== null && !event.isTeams;
  const maps = tournament.isOnline ? null : mapsLink(tournament);
  const finalSet = overview?.topSets[0];
  const gameName = event.videogameName;
  const wins = run?.wins ?? 0;
  const losses = run?.losses ?? 0;

  return (
    <div className={styles.grid}>
      <div className={styles.main}>
        {status === "loading" || status === "idle" ? (
          <Panel className={styles.top8} title={<Trans>Top 8</Trans>}>
            <SkeletonRows count={8} />
          </Panel>
        ) : standings.length === 0 ? (
          <div className={cn(styles.empty, styles.top8)}>
            <h2>
              {status === "error" ? (
                <Trans>Couldn't load this event</Trans>
              ) : upcoming ? (
                <Trans>Not started yet</Trans>
              ) : (
                <Trans>No results yet</Trans>
              )}
            </h2>
            {status === "error" ? (
              <LoadFailed onRetry={onRetry} />
            ) : (
              <p>
                <Trans>
                  Placements, the top 8 bracket and upsets show up here once
                  sets are reported.
                </Trans>
              </p>
            )}
          </div>
        ) : (
          <>
            {podium.length > 0 && (
              <div className={styles.podium}>
                {podium.map((entry) => (
                  <PodiumCard
                    key={entry.entrantId}
                    entry={entry}
                    event={event}
                    characters={overview?.characters[entry.entrantId]}
                  />
                ))}
              </div>
            )}

            <Panel
              className={styles.top8}
              title={
                standings.every((entry) => entry.isFinal) ? (
                  <Trans>Top 8</Trans>
                ) : (
                  <Trans>Top 8 so far</Trans>
                )
              }
              aside={
                event.numEntrants > standings.length ? (
                  <button type="button" onClick={onShowStandings}>
                    <Trans>All {event.numEntrants} placements</Trans>
                  </button>
                ) : undefined
              }
            >
              <ol className={styles.rows}>
                {standings.map((entry, index) => (
                  <li
                    key={entry.entrantId}
                    className={cn(
                      styles.row,
                      index < podium.length && styles.onPodium,
                    )}
                  >
                    <span className={styles.place}>{entry.placement}</span>
                    <CharacterIcons
                      characters={overview?.characters[entry.entrantId]}
                      event={event}
                    />
                    <span className={styles.tag}>
                      <EntrantName prefix={entry.prefix} tag={entry.tag} />
                    </span>
                    {entry.seed !== null && (
                      <span className={styles.seed}>
                        <Trans>Seed {entry.seed}</Trans>
                      </span>
                    )}
                    {entry.isFinal && (
                      <SeedDelta
                        seed={entry.seed}
                        placement={entry.placement}
                      />
                    )}
                  </li>
                ))}
              </ol>
              {finalSet && (
                <button
                  type="button"
                  className={styles.more}
                  onClick={onShowBracket}
                >
                  <Trans>See the bracket</Trans>
                </button>
              )}
            </Panel>
          </>
        )}

        {/* Upsets wait for the overview, which says where the seeding is:
            without it there is nothing to load them from. */}
        {!upcoming && status !== "error" && (
          <Upsets event={event} seedPhaseId={overview?.seedPhaseId ?? null} />
        )}
      </div>

      <aside className={styles.rail}>
        {run && (
          <Panel
            className={styles.run}
            accent
            title={<Trans>Your run</Trans>}
            aside={event.name}
          >
            <dl className={styles.runStats}>
              {run.placement !== null && (
                <div>
                  <dd className={styles.runPlace}>
                    {formatOrdinal(run.placement, i18n.locale)}
                  </dd>
                  <dt>
                    <Trans>of {event.numEntrants}</Trans>
                  </dt>
                </div>
              )}
              {run.wins + run.losses > 0 && (
                <div>
                  <dd>
                    <Trans>
                      {wins}–{losses}
                    </Trans>
                  </dd>
                  <dt>
                    <Trans>Sets</Trans>
                  </dt>
                </div>
              )}
              {run.seed !== null && (
                <div>
                  <dd>{run.seed}</dd>
                  <dt>
                    <Trans>Seed</Trans>
                  </dt>
                </div>
              )}
            </dl>
            {canRecap && !upcoming && (
              <div className={styles.runAction}>
                <Link
                  className={styles.primary}
                  href={recapLink(event.slug, run.entrantId)}
                  onClick={() => logToolLinkClick("recap", "tournament")}
                >
                  <FaClipboardList aria-hidden="true" />
                  <Trans>Make my recap</Trans>
                </Link>
              </div>
            )}
          </Panel>
        )}

        <Panel
          className={styles.tools}
          title={<Trans>Make something</Trans>}
          aside={tournament.events.length > 1 ? event.name : undefined}
        >
          {event.game === null ? (
            <p className={styles.note}>
              {gameName ? (
                <Trans>The graphic tools don't cover {gameName} yet.</Trans>
              ) : (
                <Trans>The graphic tools don't cover this game yet.</Trans>
              )}
            </p>
          ) : (
            <ul className={styles.toolList}>
              {upcoming ? (
                <li>
                  <Link
                    className={styles.tool}
                    href={predictLink(event.slug)}
                    onClick={() => logToolLinkClick("predict", "tournament")}
                  >
                    <FaListOl aria-hidden="true" />
                    <span>
                      <strong>
                        <Trans>Prediction</Trans>
                      </strong>
                      <small>
                        <Trans>Rank the entrants before it starts</Trans>
                      </small>
                    </span>
                    <FaArrowRight aria-hidden="true" />
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link
                      className={styles.tool}
                      href={rankerLink(event.slug)}
                      onClick={() => logToolLinkClick("ranker", "tournament")}
                    >
                      <FaTrophy aria-hidden="true" />
                      <span>
                        <strong>
                          <Trans>Top 8 graphic</Trans>
                        </strong>
                        <small>
                          <Trans>The standings in a template</Trans>
                        </small>
                      </span>
                      <FaArrowRight aria-hidden="true" />
                    </Link>
                  </li>
                  {canRecap && (
                    <li>
                      <Link
                        className={styles.tool}
                        href={recapLink(event.slug, null)}
                        onClick={() => logToolLinkClick("recap", "tournament")}
                      >
                        <FaClipboardList aria-hidden="true" />
                        <span>
                          <strong>
                            <Trans>Player recap</Trans>
                          </strong>
                          <small>
                            <Trans>Any entrant's run as an image</Trans>
                          </small>
                        </span>
                        <FaArrowRight aria-hidden="true" />
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          )}
        </Panel>

        {tournament.streams.length > 0 && (
          <Panel className={styles.watch} title={<Trans>Watch</Trans>}>
            <ul className={styles.toolList}>
              {tournament.streams.slice(0, 4).map((stream) => (
                <li key={stream.name}>
                  {stream.url ? (
                    <a
                      className={styles.tool}
                      href={stream.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>
                        <strong>{stream.name}</strong>
                      </span>
                      <FaArrowUpRightFromSquare aria-hidden="true" />
                    </a>
                  ) : (
                    <span className={styles.tool}>
                      <span>
                        <strong>{stream.name}</strong>
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {(tournament.venueName || tournament.venueAddress) && (
          <Panel
            className={styles.venue}
            title={<Trans>Venue</Trans>}
            aside={
              maps ? (
                <a href={maps} target="_blank" rel="noreferrer">
                  <Trans>Open in Maps</Trans>
                </a>
              ) : undefined
            }
          >
            <div className={styles.venueText}>
              {tournament.venueName && <strong>{tournament.venueName}</strong>}
              {tournament.venueAddress && (
                <span>{tournament.venueAddress}</span>
              )}
            </div>
          </Panel>
        )}
      </aside>
    </div>
  );
};
