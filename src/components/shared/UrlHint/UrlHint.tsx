import { Trans } from "@lingui/react/macro";
import { Link } from "wouter";

import { startggTournamentOnlySlug } from "@/consts/platforms";
import { tournamentLink } from "@/utils/user/toolLinks";

import styles from "./UrlHint.module.scss";

type Props = {
  // What is in the field, which is not a link a tool can load.
  url: string;
};

// Says why a tournament URL field will not load what is in it, under the
// field: a red border alone tells nobody what to paste instead. A start.gg
// tournament link with no event gets a way on, to the tournament's page.
// Its parent has to be positioned.
export const UrlHint = ({ url }: Props) => {
  const tournamentSlug = startggTournamentOnlySlug(url);

  return (
    <p className={styles.hint} role="status">
      {tournamentSlug ? (
        <>
          <Trans>This link is a tournament, not one of its events.</Trans>{" "}
          {/* Clicking must not take focus from the field first: a field that
              hides its hint on blur would remove the link mid-click. */}
          <Link
            href={tournamentLink(tournamentSlug)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Trans>Pick an event</Trans>
          </Link>
        </>
      ) : (
        <Trans>
          This is not an event link. An event link looks like
          start.gg/tournament/…/event/…
        </Trans>
      )}
    </p>
  );
};
