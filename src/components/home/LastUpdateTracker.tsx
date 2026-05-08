import { useEffect, useState } from "react";
import { FaClock } from "react-icons/fa6";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import styles from "./LastUpdateTracker.module.scss";

const COMMITS_URL =
  "https://api.github.com/repos/rmatsuda21/smash-ranker/commits?per_page=1";

type State =
  | { status: "loading" }
  | { status: "ready"; date: Date; url: string }
  | { status: "error" };

const formatRelative = (date: Date, locale: string): string => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), "day");
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const LastUpdateTracker = () => {
  const { i18n } = useLingui();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(COMMITS_URL, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        const data = (await res.json()) as Array<{
          html_url: string;
          commit: { author: { date: string } };
        }>;
        const first = data[0];
        if (!first) throw new Error("No commits returned");
        setState({
          status: "ready",
          date: new Date(first.commit.author.date),
          url: first.html_url,
        });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.warn("[LastUpdateTracker] failed to fetch latest commit", err);
        setState({ status: "error" });
      });

    return () => controller.abort();
  }, []);

  if (state.status === "error") return null;

  if (state.status === "loading") {
    return (
      <span className={styles.tracker} aria-busy="true">
        <FaClock className={styles.clockSpin} />
        <span className={styles.skeletonBar} aria-hidden="true" />
      </span>
    );
  }

  return (
    <a
      href={state.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.tracker}
    >
      <FaClock />
      <span>
        <Trans>Updated {formatRelative(state.date, i18n.locale)}</Trans>
      </span>
    </a>
  );
};
