import { FaClock } from "react-icons/fa6";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import styles from "./LastUpdateTracker.module.scss";

const BUILD_DATE = new Date(__BUILD_TIME__);

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

  if (Number.isNaN(BUILD_DATE.getTime())) return null;

  return (
    <span className={styles.tracker}>
      <FaClock />
      <span>
        <Trans>Updated {formatRelative(BUILD_DATE, i18n.locale)}</Trans>
      </span>
    </span>
  );
};
