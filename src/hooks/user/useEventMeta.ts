import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import type { UserEvent } from "@/types/user/UserEvent";

const formatEventDate = (startAt: number | null, locale: string) =>
  startAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(startAt)
    : "";

// "Mar 3, 2026 · Brooklyn, NY", with the event name first when asked.
export const useEventMeta = () => {
  const { _, i18n } = useLingui();
  return (event: UserEvent, { withName = true } = {}): string =>
    [
      withName ? event.name : "",
      formatEventDate(event.startAt, i18n.locale),
      event.isOnline
        ? _(msg`Online`)
        : [event.tournament.city, event.tournament.state]
            .filter(Boolean)
            .join(", "),
    ]
      .filter(Boolean)
      .join(" · ");
};
