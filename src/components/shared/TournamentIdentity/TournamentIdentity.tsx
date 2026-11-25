import cn from "classnames";
import { Link } from "wouter";

import { tournamentLink } from "@/utils/user/toolLinks";

import styles from "./TournamentIdentity.module.scss";

type Props = {
  href: string;
  // start.gg's tournament id, when the tournament came from there.
  tournamentId?: string;
  iconUrl: string;
  name: string;
  meta: string;
  className?: string;
};

// Which tournament is loaded, for a toolbar: icon, name, then event and date.
// Links to the site's own page for the tournament when it is a start.gg one,
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

  if (tournamentId) {
    return (
      <Link
        className={cn(styles.root, className)}
        href={tournamentLink(tournamentId)}
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
