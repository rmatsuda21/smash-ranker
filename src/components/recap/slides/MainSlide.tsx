import { useEffect, useMemo, useState, type CSSProperties } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { CountUp } from "@/components/recap/CountUp";
import type { Recap, RecapCharacter } from "@/types/recap/Recap";
import { fitSize, monthName } from "@/utils/recap/recapText";
import {
  getCharacter,
  getCharacterGame,
  getCharactersForGame,
} from "@/utils/top8/characterCatalog";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

import styles from "../recap.module.scss";

// How many icons the roulette shows before it lands.
const ROULETTE_STEPS = 12;
// A month needs this many recorded picks to count as a character's peak.
const MIN_PEAK_PICKS = 10;

const rate = (character: RecapCharacter) => {
  const sets = character.wins + character.losses;
  return sets ? Math.round((character.wins / sets) * 100) : 0;
};

// A ring of head icons that spins and stops on the main.
const Roulette = ({ characterId }: { characterId: string }) => {
  const icons = useMemo(() => {
    const game = getCharacterGame(characterId);
    const pool = game ? getCharactersForGame(game) : [];
    const step = Math.max(1, Math.floor(pool.length / ROULETTE_STEPS));
    const ids = Array.from(
      { length: ROULETTE_STEPS - 1 },
      (_, i) => pool[(i * step + 3) % Math.max(1, pool.length)]?.id,
    ).filter((id): id is string => Boolean(id) && id !== characterId);
    return [...ids, characterId].map((id) =>
      getCharImgUrl({ characterId: id, type: "stock" }),
    );
  }, [characterId]);
  const [shown, setShown] = useState(icons.length - 1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    icons.forEach((src) => {
      new Image().src = src;
    });
    let step = 0;
    let timer = 0;
    const next = () => {
      setShown(step);
      step++;
      // Slows down as it gets to the main.
      if (step < icons.length) timer = window.setTimeout(next, 50 + step * 7);
    };
    next();
    return () => window.clearTimeout(timer);
  }, [icons]);

  return (
    <div className={styles.mRoul} aria-hidden="true">
      <span>
        <img src={icons[shown]} alt="" />
      </span>
    </div>
  );
};

export const MainSlide = ({ recap }: { recap: Recap }) => {
  const { i18n } = useLingui();
  const isJa = i18n.locale.startsWith("ja");
  const nameOf = (id: string) => {
    const character = getCharacter(id);
    return (isJa && character?.nameJa) || character?.name || "";
  };

  const [main, second, third] = recap.characters;
  const name = nameOf(main.id);
  const winRate = rate(main);
  const share = recap.recordedGames
    ? Math.round((main.games / recap.recordedGames) * 100)
    : 0;
  const games = main.games;

  // The month the second character was picked most.
  const peakMonth = second
    ? recap.mix.reduce(
        (best, month, index) =>
          month.total >= MIN_PEAK_PICKS &&
          month.shares[1] > (recap.mix[best]?.shares[1] ?? -1)
            ? index
            : best,
        -1,
      )
    : -1;
  const secondName = second ? nameOf(second.id) : "";
  const peak = peakMonth >= 0 ? recap.mix[peakMonth].shares[1] : 0;
  const peakName = peakMonth >= 0 ? monthName(peakMonth, i18n.locale) : "";

  return (
    <section className={cn(styles.slide, styles.gYellow, styles.main)}>
      <div className={styles.mBurst} aria-hidden="true" />
      <p className={cn(styles.disp, styles.ghost)} aria-hidden="true">
        {name}
      </p>
      <img
        className={styles.art}
        src={getCharImgUrl({ characterId: main.id })}
        alt=""
      />
      <p
        className={cn(styles.kicker, styles.rise)}
        style={{ "--i": 14 } as CSSProperties}
      >
        <Trans>Your most played</Trans>
      </p>
      <p
        className={cn(styles.disp, styles.name, styles.rise)}
        style={
          { "--i": 15, "--fs": `${fitSize(name, 27, 86)}cqw` } as CSSProperties
        }
      >
        {name}
      </p>
      <div
        className={cn(styles.mRec, styles.rise)}
        style={{ "--i": 17 } as CSSProperties}
      >
        <p className={styles.mRecLabel}>
          <Trans>Your sets on {name}</Trans>
        </p>
        <p
          className={cn(styles.disp, styles.mRecValue)}
          style={
            {
              // Sized so the longer of the two numbers fits the column.
              "--fs": `${fitSize(`${Math.max(main.wins, main.losses)}W`, 15, 23)}cqw`,
            } as CSSProperties
          }
        >
          <span>
            <CountUp value={main.wins} delay={1700} />
            <small>
              <Trans context="recap" comment="Wins, one letter after a number">
                W
              </Trans>
            </small>
          </span>
          <span>
            <CountUp value={main.losses} delay={1700} />
            <small>
              <Trans
                context="recap"
                comment="Losses, one letter after a number"
              >
                L
              </Trans>
            </small>
          </span>
        </p>
        <div className={styles.mBar}>
          <b style={{ width: `${winRate}%` }} />
        </div>
        <p className={styles.mRecDetail}>
          <Trans>{winRate}% of those sets won</Trans>
        </p>
      </div>

      <div className={styles.grow} />
      <p
        className={cn(styles.mSub, styles.rise)}
        style={{ "--i": 22 } as CSSProperties}
      >
        <Trans>
          Picked in {share}% of your recorded games ({games}).
        </Trans>{" "}
        {peak > 0 ? (
          <Trans>
            Picks by month. {secondName} peaked in {peakName} ({peak}%).
          </Trans>
        ) : (
          <Trans>Picks by month.</Trans>
        )}
      </p>
      <div className={styles.mMix} aria-hidden="true">
        {recap.mix.map((month, index) => (
          <i
            key={index}
            className={cn(month.total === 0 && styles.mixNone)}
            style={{ "--w": index } as CSSProperties}
          >
            <b
              className={styles.mixThird}
              style={{ height: `${month.shares[2] ?? 0}%` }}
            />
            <b
              className={styles.mixSecond}
              style={{ height: `${month.shares[1] ?? 0}%` }}
            />
          </i>
        ))}
      </div>
      {second && (
        <div className={styles.mDuo}>
          {[second, third].map((character, index) => {
            if (!character) return <div key={index} />;
            const wins = character.wins;
            const losses = character.losses;
            const won = rate(character);
            return (
              <div key={character.id} className={styles.mPan}>
                <img
                  src={getCharImgUrl({ characterId: character.id })}
                  alt=""
                />
                <p className={cn(styles.disp, styles.mRk)}>{index + 2}</p>
                <p className={styles.mPn}>
                  <b>{nameOf(character.id)}</b>
                  <span>
                    <Trans>
                      Sets {wins}–{losses}
                      <br />
                      {won}% won
                    </Trans>
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Roulette characterId={main.id} />
      <div
        className={styles.flash}
        style={{ "--at": "1.15s" } as CSSProperties}
      />
    </section>
  );
};
