import cn from "classnames";
import { Trans } from "@lingui/react/macro";

import { Button } from "@/components/shared/Button/Button";

import type { TournamentEvent } from "@/types/tournament/Tournament";
import { computeSeedDelta } from "@/utils/results/upsetFactor";
import { getCharacter } from "@/utils/top8/characterCatalog";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

import styles from "./TournamentParts.module.scss";

// What takes the place of something that failed to load, with a way to load
// it again.
export const LoadFailed = ({
  onRetry,
  className,
}: {
  onRetry: () => void;
  className?: string;
}) => (
  <div className={cn(styles.loadFailed, className)} role="status">
    <p>
      <Trans>This didn't load.</Trans>
    </p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      <Trans>Try again</Trans>
    </Button>
  </div>
);

// A titled card. `aside` sits opposite the title (a count, a link).
export const Panel = ({
  title,
  aside,
  accent,
  className,
  children,
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  accent?: boolean;
  className?: string;
  children: React.ReactNode;
}) => (
  <section className={cn(styles.panel, accent && styles.accent, className)}>
    <header className={styles.panelHead}>
      <h2>{title}</h2>
      {aside && <div className={styles.aside}>{aside}</div>}
    </header>
    {children}
  </section>
);

// Sponsor in a quieter weight before the tag.
export const EntrantName = ({
  prefix,
  tag,
}: {
  prefix?: string | null;
  tag: string;
}) => (
  <>
    {prefix && <span className={styles.prefix}>{prefix}</span>}
    {tag}
  </>
);

// Head icons of the characters an entrant played: one in singles, the two
// most picked for a team.
export const CharacterIcons = ({
  characters,
  event,
  size = 24,
}: {
  characters: string[] | undefined;
  event: TournamentEvent;
  size?: number;
}) => {
  const shown = (characters ?? []).slice(0, event.isTeams ? 2 : 1);
  return (
    <span className={styles.characters} style={{ minWidth: size }}>
      {shown.map((id) => (
        <img
          key={id}
          src={getCharImgUrl({ characterId: id, type: "stock" })}
          alt={getCharacter(id)?.name ?? ""}
          width={size}
          height={size}
          loading="lazy"
        />
      ))}
    </span>
  );
};

// How many placement tiers an entrant finished above their seed.
export const SeedDelta = ({
  seed,
  placement,
}: {
  seed: number | null;
  placement: number | null;
}) => {
  const delta = seed && placement ? computeSeedDelta(seed, placement) : null;
  if (delta === null || delta === 0) {
    return <span className={styles.delta}>–</span>;
  }
  return (
    <span className={cn(styles.delta, delta > 0 ? styles.up : styles.down)}>
      {delta > 0 ? `+${delta}` : `−${-delta}`}
    </span>
  );
};

// Rows standing in for a list that is still loading, at the list's height.
export const SkeletonRows = ({ count }: { count: number }) => (
  <div className={styles.skeleton} aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <span key={index} />
    ))}
  </div>
);
