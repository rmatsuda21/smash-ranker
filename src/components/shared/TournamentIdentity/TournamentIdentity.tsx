import cn from "classnames";
import { Link } from "wouter";

import { detectPlatformAndSlug } from "@/consts/platforms";
import { HIVEE_UUID } from "@/utils/hivee/api";
import { tournamentLink } from "@/utils/user/toolLinks";

import styles from "./TournamentIdentity.module.scss";

type Props = {
  href: string;
  // start.gg's tournament id or a Hivee event's id, when the tournament came
  // from one of them.
  tournamentId?: string;
  iconUrl: string;
  name: string;
  meta: string;
  className?: string;
};

// A Hivee event's id is in its link, so a tournament a tool loaded before
// it kept the id (the tools persist what they loaded) still gets the site's
// page. A short Hivee link has a name where the id would be, and does not.
const hiveeEventId = (href: string): string | undefined => {
  const detected = detectPlatformAndSlug(href);
  if (detected?.platform !== "hivee") return undefined;
  const [event] = detected.slug.split("/");
  return HIVEE_UUID.test(event) ? event : undefined;
};

// Which tournament is loaded, for a toolbar: icon, name, then event and date.
// Links to the site's own page for the tournament when it has one (start.gg, Hivee),
// and to the tournament's page on its platform otherwise. The icon is as tall as
// the toolbar's controls (`--toolbar-h`).
export const TournamentIdentity = ({
  href,
  tournamentId,
  iconUrl,
  name,
  meta,
  className,
}: Props) => {
  const content = (
    <>
      {iconUrl && <img className={styles.icon} src={iconUrl} alt="" />}
      <div className={styles.text}>
        <h2 className={styles.name}>{name}</h2>
        {meta && <p className={styles.meta}>{meta}</p>}
      </div>
    </>
  );

  const pageId = tournamentId || hiveeEventId(href);
  if (pageId) {
    return (
      <Link
        className={cn(styles.root, className)}
        href={tournamentLink(pageId)}
      >
        {content}
      </Link>
    );
  }

  return href ? (
    <a
      className={cn(styles.root, className)}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {content}
    </a>
  ) : (
    <div className={cn(styles.root, className)}>{content}</div>
  );
};
