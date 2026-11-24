import cn from "classnames";

import styles from "./TournamentIdentity.module.scss";

type Props = {
  href: string;
  iconUrl: string;
  name: string;
  meta: string;
  className?: string;
};

// Which tournament is loaded, for a toolbar: icon, name, then event and date.
// Links to the tournament page when its URL is known. The icon is as tall as
// the toolbar's controls (`--toolbar-h`).
export const TournamentIdentity = ({
  href,
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
