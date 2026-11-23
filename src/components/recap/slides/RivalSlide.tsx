import type { CSSProperties } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";

import { RecapAvatar } from "@/components/recap/RecapAvatar";
import type { Recap, RecapOpponent } from "@/types/recap/Recap";
import { fitSize, formatScore } from "@/utils/recap/recapText";

import styles from "../recap.module.scss";

// The head-to-head strip holds this many sets; a longer history shows its
// latest ones.
const MAX_CHIPS = 12;

const Wins = ({ count }: { count: number }) => (
  <p className={cn(styles.disp, styles.rvWins)}>
    {count}
    <small>
      {count === 1 ? (
        <Trans comment="After a number: 1 win">win</Trans>
      ) : (
        <Trans comment="After a number: 5 wins">wins</Trans>
      )}
    </small>
  </p>
);

const Tag = ({ tag }: { tag: string }) => (
  <p
    className={cn(styles.disp, styles.rvTag)}
    style={{ "--fs": `${fitSize(tag, 13, 46)}cqw` } as CSSProperties}
  >
    {tag}
  </p>
);

const Other = ({
  opponent,
  children,
}: {
  opponent: RecapOpponent;
  children: React.ReactNode;
}) => (
  <div>
    <span className={styles.who}>
      <RecapAvatar name={opponent.tag} url={opponent.avatarUrl} />
      <b>{opponent.tag}</b>
    </span>
    <span>{children}</span>
  </div>
);

export const RivalSlide = ({ recap }: { recap: Recap }) => {
  const { player, year, nemesis, favorite } = recap;
  const rival = recap.rival!;
  const total = recap.rivalSets.length;
  const chips = recap.rivalSets.slice(-MAX_CHIPS);
  const nemesisWins = nemesis?.wins ?? 0;
  const nemesisLosses = nemesis?.losses ?? 0;
  const favoriteWins = favorite?.wins ?? 0;

  return (
    <section className={cn(styles.slide, styles.rival)}>
      <div className={cn(styles.half, styles.halfYou)}>
        <p className={styles.kicker}>
          <Trans>Your rival · the player you faced most</Trans>
        </p>
        <div className={styles.rv}>
          <RecapAvatar name={player.tag} url={player.avatarUrl} />
          <div>
            <Tag tag={player.tag} />
            <Wins count={rival.wins} />
          </div>
        </div>
      </div>

      <div className={cn(styles.half, styles.halfThem)}>
        <div className={cn(styles.rv, styles.rvThem)}>
          <div>
            <Wins count={rival.losses} />
            <Tag tag={rival.tag} />
          </div>
          <RecapAvatar name={rival.tag} url={rival.avatarUrl} />
        </div>
        <p className={styles.h2hLabel}>
          {total > MAX_CHIPS ? (
            <Trans>
              Head to head in {year} · last {MAX_CHIPS} of {total} sets
            </Trans>
          ) : (
            <Trans>
              Head to head in {year} · all {total} sets, oldest first
            </Trans>
          )}
        </p>
        <div
          className={styles.h2h}
          style={{ "--n": Math.max(chips.length, 6) } as CSSProperties}
        >
          {chips.map((set, index) => (
            <i
              key={index}
              className={cn(set.won && styles.h2hWon)}
              style={{ "--w": index } as CSSProperties}
            >
              {formatScore(set.score) || "–"}
            </i>
          ))}
        </div>
        <p className={styles.h2hKey}>
          <Trans>
            Blue: you won. Black: they won. Numbers are the game count.
          </Trans>
        </p>
        <div className={styles.others}>
          {nemesis && (
            <Other opponent={nemesis}>
              <Trans>
                <b>
                  {nemesisWins}–{nemesisLosses}
                </b>{" "}
                · toughest opponent
              </Trans>
            </Other>
          )}
          {favorite && favorite.wins > 1 && favorite.tag !== rival.tag && (
            <Other opponent={favorite}>
              <Trans>
                <b>{favoriteWins}–0</b> · never lost to
              </Trans>
            </Other>
          )}
        </div>
      </div>

      <p className={cn(styles.disp, styles.vs)}>VS</p>
      <div className={styles.flash} />
    </section>
  );
};
