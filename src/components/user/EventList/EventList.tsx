import { useEffect, useMemo, useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { FaMagnifyingGlass } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { EventRow } from "@/components/user/EventRow/EventRow";
import type { UserEvent } from "@/types/user/UserEvent";
import {
  readUserPageMemory,
  writeUserPageMemory,
} from "@/utils/user/pageMemory";

import styles from "./EventList.module.scss";

// Tournaments revealed per "Show more".
const PAGE_SIZE = 16;
// Enough to fill a screen while the first page loads.
const SKELETON_ROWS = 8;

type Props = {
  events: UserEvent[];
  // More events are still arriving from start.gg.
  loading: boolean;
  total: number;
};

// Every tournament the user has entered, newest first, each with links
// into the graphic tools. Search runs over what has loaded so far.
export const EventList = ({ events, loading, total }: Props) => {
  const { _ } = useLingui();
  // Search and "Show more" pick up where they were when the user comes
  // Back to the page, so the tournament they left from is still in the list.
  const [query, setQuery] = useState(() => readUserPageMemory().query ?? "");
  const [visible, setVisible] = useState(
    () => readUserPageMemory().visible ?? PAGE_SIZE,
  );
  useEffect(() => {
    writeUserPageMemory({ query, visible });
  }, [query, visible]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return events;
    return events.filter((event) =>
      [event.tournament.name, event.name, event.tournament.city]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [events, query]);

  const shown = matches.slice(0, visible);

  return (
    <section className={styles.root}>
      <div className={styles.heading}>
        <h2 className={styles.title}>
          <Trans>Your tournaments</Trans>
          {total > 0 && <span className={styles.count}>{total}</span>}
        </h2>
        <label className={styles.search}>
          <FaMagnifyingGlass aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder={_(msg`Search tournaments`)}
            aria-label={_(msg`Search tournaments`)}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setVisible(PAGE_SIZE);
            }}
          />
        </label>
      </div>

      {loading && events.length === 0 ? (
        <div className={cn(styles.list, styles.skeleton)} aria-hidden="true">
          {[...Array(SKELETON_ROWS).keys()].map((i) => (
            <span key={i} />
          ))}
        </div>
      ) : shown.length > 0 ? (
        <ul className={styles.list}>
          {shown.map((event) => (
            <EventRow key={event.id} event={event} stacked />
          ))}
        </ul>
      ) : (
        !loading && (
          <p className={styles.empty}>
            <Trans>No tournaments match "{query}".</Trans>
          </p>
        )
      )}

      {matches.length > visible && (
        <Button
          className={styles.more}
          variant="outline"
          size="lg"
          onClick={() => setVisible((n) => n + PAGE_SIZE)}
        >
          <Trans>Show more</Trans>
        </Button>
      )}
      {loading && (
        <p className={styles.loading} role="status">
          <Trans>Loading more from start.gg...</Trans>
        </p>
      )}
    </section>
  );
};
