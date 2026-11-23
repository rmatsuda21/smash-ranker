import type { CSSProperties } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";

import { RecapAvatar } from "@/components/recap/RecapAvatar";
import type { Recap } from "@/types/recap/Recap";
import { formatScore } from "@/utils/recap/recapText";

import styles from "../recap.module.scss";

// More dots than this stop reading as a count.
const MAX_DOTS = 80;

export const UpsetSlide = ({ recap }: { recap: Recap }) => {
  const [top, ...rest] = recap.upsets;
  const { player, upsetCount, aboveSeed } = recap;
  const opponent = top.opponent;
  const factor = top.factor;
  const score = formatScore(top.score);
  const tournament = top.tournament;
  const { beaten, seeded } = aboveSeed;
  const dots = Math.min(seeded, MAX_DOTS);

  // Drawn twice, one copy per half of the cut.
  const theirCard = (
    <>
      <p>
        <RecapAvatar name={top.opponent} url={top.avatarUrl} />
        <span>
          <Trans>{opponent} · seed</Trans>
        </span>
      </p>
      <p className={styles.disp}>{top.opponentSeed}</p>
    </>
  );

  return (
    <section
      className={cn(styles.slide, styles.gGreen, styles.upset, styles.shake)}
    >
      <p className={cn(styles.kicker, styles.rise)}>
        <Trans>Biggest upset</Trans>
      </p>
      <div className={styles.seeds}>
        <div className={styles.themWrap}>
          <div className={cn(styles.seed, styles.cutA)}>{theirCard}</div>
          <div className={cn(styles.seed, styles.cutB)} aria-hidden="true">
            {theirCard}
          </div>
        </div>
        <i className={styles.slashFx} aria-hidden="true" />
        <div className={cn(styles.seed, styles.seedYou)}>
          <p>
            <RecapAvatar name={player.tag} url={player.avatarUrl} />
            <span>
              <Trans>You · seed</Trans>
            </span>
          </p>
          <p className={styles.disp}>{top.seed}</p>
        </div>
        <p className={cn(styles.disp, styles.stamp)}>
          <Trans>Slayed</Trans>
        </p>
        <span className={styles.uf}>
          <Trans>Upset factor {factor}</Trans>
        </span>
      </div>

      <p
        className={styles.rise}
        style={{ "--i": 24, marginTop: "3cqw" } as CSSProperties}
      >
        {score ? (
          <Trans>
            <b>
              {score} at {tournament}.
            </b>{" "}
            Nobody had that on their bracket.
          </Trans>
        ) : (
          <Trans>
            <b>At {tournament}.</b> Nobody had that on their bracket.
          </Trans>
        )}
      </p>
      {rest.length > 0 && (
        <>
          <p
            className={cn(styles.sub, styles.rise)}
            style={{ "--i": 25 } as CSSProperties}
          >
            <Trans>More upsets ({upsetCount} in all)</Trans>
          </p>
          <div className={styles.ups}>
            {rest.slice(0, 3).map((upset, index) => {
              const seed = upset.seed;
              const opponentSeed = upset.opponentSeed;
              return (
                <div
                  key={index}
                  className={styles.up}
                  style={{ "--w": index } as CSSProperties}
                >
                  <RecapAvatar name={upset.opponent} url={upset.avatarUrl} />
                  <div>
                    <b>{upset.opponent}</b>
                    <br />
                    <Trans>
                      seed {seed} beat seed {opponentSeed}
                    </Trans>
                  </div>
                  <span className={styles.upBadge}>UF {upset.factor}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className={styles.grow} />
      {seeded > 0 && (
        <>
          <p className={styles.rise} style={{ "--i": 16 } as CSSProperties}>
            <Trans>
              <b>
                {beaten} of {seeded}
              </b>{" "}
              brackets finished above your seed.
            </Trans>
          </p>
          <div
            className={styles.beat}
            style={{
              gridTemplateColumns: `repeat(${Math.max(19, Math.ceil(dots / 2))}, 1fr)`,
            }}
            aria-hidden="true"
          >
            {Array.from({ length: dots }, (_, i) => (
              <i
                key={i}
                className={cn(i < beaten && styles.beatFull)}
                style={{ "--w": i } as CSSProperties}
              />
            ))}
          </div>
        </>
      )}
      <div
        className={styles.flash}
        style={{ "--at": "1.15s" } as CSSProperties}
      />
    </section>
  );
};
