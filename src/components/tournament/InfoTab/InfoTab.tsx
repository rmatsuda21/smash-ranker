import cn from "classnames";
import { Plural, Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";

import { Panel } from "@/components/tournament/TournamentParts/TournamentParts";
import type { TournamentDetails } from "@/types/tournament/Tournament";
import {
  formatTournamentDates,
  formatTournamentPlace,
  mapsLink,
} from "@/utils/tournament/format";

import styles from "./InfoTab.module.scss";

type Props = {
  tournament: TournamentDetails;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
};

// Everything about the tournament that is not a result: when and where,
// who runs it, where to watch, and every event it holds.
export const InfoTab = ({
  tournament,
  selectedEventId,
  onSelectEvent,
}: Props) => {
  const { _, i18n } = useLingui();
  const maps = tournament.isOnline ? null : mapsLink(tournament);
  const place = formatTournamentPlace(tournament);

  return (
    <div className={styles.grid}>
      <Panel title={<Trans>Details</Trans>}>
        <dl className={styles.details}>
          <div>
            <dt>
              <Trans>Dates</Trans>
            </dt>
            <dd>{formatTournamentDates(tournament, i18n.locale) || "–"}</dd>
          </div>
          <div>
            <dt>
              <Trans>Where</Trans>
            </dt>
            <dd>
              {place ?? _(msg`Online`)}
              {tournament.venueAddress && (
                <span className={styles.sub}>{tournament.venueAddress}</span>
              )}
              {maps && (
                <a href={maps} target="_blank" rel="noreferrer">
                  <Trans>Open in Maps</Trans>
                </a>
              )}
            </dd>
          </div>
          {tournament.numAttendees > 0 && (
            <div>
              <dt>
                <Trans>Attendees</Trans>
              </dt>
              <dd>{tournament.numAttendees.toLocaleString(i18n.locale)}</dd>
            </div>
          )}
          {tournament.organizer && (
            <div>
              <dt>
                <Trans>Organizer</Trans>
              </dt>
              <dd>{tournament.organizer}</dd>
            </div>
          )}
          {tournament.hashtag && (
            <div>
              <dt>
                <Trans>Hashtag</Trans>
              </dt>
              <dd>#{tournament.hashtag.replace(/^#/, "")}</dd>
            </div>
          )}
          <div>
            <dt>
              <Trans>Links</Trans>
            </dt>
            <dd>
              <a href={tournament.startggUrl} target="_blank" rel="noreferrer">
                start.gg
                <FaArrowUpRightFromSquare aria-hidden="true" />
              </a>
              {tournament.discordUrl && (
                <a
                  href={tournament.discordUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Discord
                  <FaArrowUpRightFromSquare aria-hidden="true" />
                </a>
              )}
            </dd>
          </div>
        </dl>
      </Panel>

      <div className={styles.column}>
        {tournament.events.length > 0 && (
          <Panel
            title={<Trans context="tournament page">Events</Trans>}
            aside={tournament.events.length}
          >
            <ul className={styles.list}>
              {tournament.events.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    className={cn(
                      styles.item,
                      event.id === selectedEventId && styles.selected,
                    )}
                    onClick={() => onSelectEvent(event.id)}
                  >
                    <strong>{event.name}</strong>
                    <small>
                      {event.videogameName && (
                        <span>{event.videogameName}</span>
                      )}
                      {event.numEntrants > 0 && (
                        <span>
                          {event.isTeams ? (
                            <Plural
                              value={event.numEntrants}
                              one="# team"
                              other="# teams"
                            />
                          ) : (
                            <Plural
                              value={event.numEntrants}
                              one="# entrant"
                              other="# entrants"
                            />
                          )}
                        </span>
                      )}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {tournament.streams.length > 0 && (
          <Panel title={<Trans>Streams</Trans>}>
            <ul className={styles.list}>
              {tournament.streams.map((stream) => (
                <li key={stream.name}>
                  {stream.url ? (
                    <a
                      className={styles.item}
                      href={stream.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <strong>{stream.name}</strong>
                    </a>
                  ) : (
                    <span className={styles.item}>
                      <strong>{stream.name}</strong>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
};
