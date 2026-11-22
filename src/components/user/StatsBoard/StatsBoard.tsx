import { useMemo } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import {
  FaAward,
  FaBolt,
  FaCalendarDays,
  FaFire,
  FaLocationDot,
  FaMedal,
  FaRankingStar,
  FaTrophy,
  FaUserGroup,
} from "react-icons/fa6";

import { useCountUp } from "@/hooks/useCountUp";
import type { UserEvent } from "@/types/user/UserEvent";
import type { UserSet } from "@/types/user/UserSet";
import {
  computeCareerStats,
  computeSetStats,
  type Matchup,
} from "@/utils/user/careerStats";
import { formatOrdinal } from "@/utils/user/ordinal";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { getCharacterDisplayName } from "@/utils/top8/getCharacterName";
import { isKnownCharacter } from "@/utils/top8/characterCatalog";

import styles from "./StatsBoard.module.scss";

type TileProps = {
  label: React.ReactNode;
  icon?: React.ReactNode;
  wide?: boolean;
  className?: string;
  index: number;
  children: React.ReactNode;
};

const Tile = ({ label, icon, wide, className, index, children }: TileProps) => (
  <section
    className={cn(styles.tile, wide && styles.wide, className)}
    style={{ "--i": index } as React.CSSProperties}
  >
    <h3 className={styles.label}>
      {icon}
      {label}
    </h3>
    {children}
  </section>
);

const CountUp = ({ value, suffix }: { value: number; suffix?: string }) => {
  const { i18n } = useLingui();
  const shown = Math.round(useCountUp(value));
  return (
    <span className={styles.number}>
      {new Intl.NumberFormat(i18n.locale).format(shown)}
      {suffix}
    </span>
  );
};

const RING_RADIUS = 34;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

// Win rate as a ring that draws itself in.
const WinRing = ({ percent }: { percent: number }) => (
  <div className={styles.ring}>
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <circle className={styles.ringTrack} cx="40" cy="40" r={RING_RADIUS} />
      <circle
        className={styles.ringValue}
        cx="40"
        cy="40"
        r={RING_RADIUS}
        strokeDasharray={RING_LENGTH}
        style={
          {
            "--ring-length": RING_LENGTH,
            "--ring-offset": RING_LENGTH * (1 - percent / 100),
          } as React.CSSProperties
        }
      />
    </svg>
    <span className={styles.ringLabel}>
      <CountUp value={percent} suffix="%" />
    </span>
  </div>
);

// Wins against losses as one split bar.
const RecordBar = ({ wins, losses }: { wins: number; losses: number }) => {
  const total = wins + losses;
  return (
    <div className={styles.recordBar} aria-hidden="true">
      <span style={{ flexGrow: wins || (total ? 0 : 1) }} />
      <span style={{ flexGrow: losses }} />
    </div>
  );
};

const MatchupLine = ({
  title,
  matchup,
}: {
  title: React.ReactNode;
  matchup: Matchup;
}) => (
  <div className={styles.matchup}>
    <div className={styles.matchupHead}>
      <span className={styles.matchupTitle}>{title}</span>
      <span className={styles.matchupName}>{matchup.name}</span>
      <span className={styles.matchupRecord}>
        {matchup.wins}–{matchup.losses}
      </span>
    </div>
    <RecordBar wins={matchup.wins} losses={matchup.losses} />
  </div>
);

type Props = {
  events: UserEvent[];
  sets: UserSet[];
  setsLoading: boolean;
};

// The fun part of the profile: what the user's start.gg history adds up to.
// Rendered once every event is in, so nothing counts up twice.
export const StatsBoard = ({ events, sets, setsLoading }: Props) => {
  const { i18n } = useLingui();
  const career = useMemo(() => computeCareerStats(events), [events]);
  const setStats = useMemo(
    () => computeSetStats(sets, isKnownCharacter),
    [sets],
  );

  const monthLabel = (time: number, style: "narrow" | "long") =>
    new Intl.DateTimeFormat(i18n.locale, {
      month: style === "narrow" ? "narrow" : "long",
      ...(style === "long" ? { year: "numeric" } : {}),
    }).format(time);
  const peak = Math.max(1, ...career.activity.map((m) => m.count));
  const sinceYear = career.firstEventAt
    ? new Date(career.firstEventAt).getFullYear()
    : null;
  const weekdayName =
    career.favoriteWeekday !== null
      ? new Intl.DateTimeFormat(i18n.locale, { weekday: "long" }).format(
          // 4 Jan 1970 was a Sunday.
          new Date(1970, 0, 4 + career.favoriteWeekday),
        )
      : null;
  const totalCharacterGames = setStats.characters.reduce(
    (sum, c) => sum + c.games,
    0,
  );

  let index = 0;

  return (
    <div className={styles.board}>
      <Tile
        index={index++}
        label={<Trans>Tournaments</Trans>}
        icon={<FaTrophy aria-hidden="true" />}
      >
        <CountUp value={career.tournamentCount} />
        <p className={styles.caption}>
          {sinceYear !== null && <Trans>Competing since {sinceYear}</Trans>}
        </p>
      </Tile>

      <Tile
        index={index++}
        label={<Trans>Bracket company</Trans>}
        icon={<FaUserGroup aria-hidden="true" />}
      >
        <CountUp value={career.entrantsFaced} />
        <p className={styles.caption}>
          <Trans>entrants across every bracket you've been in</Trans>
        </p>
      </Tile>

      <Tile
        index={index++}
        label={<Trans>Streak</Trans>}
        icon={<FaFire aria-hidden="true" />}
      >
        <CountUp value={career.longestWeeklyStreak} />
        <p className={styles.caption}>
          <Trans>weeks in a row with a tournament, at your longest</Trans>
        </p>
      </Tile>

      <Tile
        index={index++}
        label={<Trans>Home turf</Trans>}
        icon={<FaLocationDot aria-hidden="true" />}
      >
        {career.homeTurf ? (
          <>
            <span className={styles.word}>{career.homeTurf.label}</span>
            <p className={styles.caption}>
              <Trans>
                {career.homeTurf.count} tournaments here, {career.cityCount}{" "}
                cities in all
              </Trans>
            </p>
          </>
        ) : (
          <>
            <span className={styles.word}>
              <Trans>Online</Trans>
            </span>
            <p className={styles.caption}>
              <Trans>No in-person tournaments yet</Trans>
            </p>
          </>
        )}
      </Tile>

      <Tile
        index={index++}
        wide
        label={<Trans>Trophy shelf</Trans>}
        icon={<FaMedal aria-hidden="true" />}
      >
        <div className={styles.shelf}>
          <div className={styles.medal}>
            <FaTrophy aria-hidden="true" />
            <CountUp value={career.wins} />
            <span>
              <Trans>Wins</Trans>
            </span>
          </div>
          <div className={styles.medal}>
            <FaRankingStar aria-hidden="true" />
            <CountUp value={career.podiums} />
            <span>
              <Trans>Top 3</Trans>
            </span>
          </div>
          <div className={styles.medal}>
            <FaAward aria-hidden="true" />
            <CountUp value={career.top8s} />
            <span>
              <Trans>Top 8</Trans>
            </span>
          </div>
        </div>
        {career.bestFinish && (
          <p className={styles.caption}>
            <Trans>
              Best run:{" "}
              <strong>
                {formatOrdinal(career.bestFinish.placement!, i18n.locale)} of{" "}
                {career.bestFinish.numEntrants}
              </strong>{" "}
              at {career.bestFinish.tournament.name}
            </Trans>
          </p>
        )}
      </Tile>

      {career.outplacedPercent !== null && (
        <Tile
          index={index++}
          wide
          label={<Trans>Ahead of the field</Trans>}
          icon={<FaRankingStar aria-hidden="true" />}
        >
          <div className={styles.fieldRow}>
            <CountUp value={career.outplacedPercent} suffix="%" />
            <p className={styles.caption}>
              <Trans>of the bracket finishes behind you, on average</Trans>
            </p>
          </div>
          <div className={styles.field} aria-hidden="true">
            <span
              className={styles.fieldFill}
              style={
                {
                  "--fill": `${career.outplacedPercent}%`,
                } as React.CSSProperties
              }
            />
          </div>
          {career.seedBeaten.seeded > 0 && (
            <p className={styles.caption}>
              <Trans>
                Finished above your seed in{" "}
                <strong>{career.seedBeaten.beaten}</strong> of{" "}
                {career.seedBeaten.seeded} brackets
              </Trans>
            </p>
          )}
        </Tile>
      )}

      <Tile
        index={index++}
        wide
        label={<Trans>Last 12 months</Trans>}
        icon={<FaCalendarDays aria-hidden="true" />}
      >
        <div className={styles.chart}>
          {career.activity.map((month, i) => (
            <div key={month.month} className={styles.chartColumn}>
              <span className={styles.chartCount}>{month.count || ""}</span>
              <span
                className={cn(
                  styles.chartBar,
                  month.count === 0 && styles.chartBarEmpty,
                )}
                style={
                  {
                    "--h": `${(month.count / peak) * 100}%`,
                    "--bar": i,
                  } as React.CSSProperties
                }
              />
              <span className={styles.chartMonth}>
                {monthLabel(month.month, "narrow")}
              </span>
            </div>
          ))}
        </div>
        {career.busiestMonth && (
          <p className={styles.caption}>
            <Trans>
              Busiest month ever:{" "}
              <strong>{monthLabel(career.busiestMonth.month, "long")}</strong>{" "}
              with {career.busiestMonth.count} tournaments
            </Trans>
          </p>
        )}
      </Tile>

      {(career.series || weekdayName) && (
        <Tile
          index={index++}
          wide
          label={<Trans>Habits</Trans>}
          icon={<FaBolt aria-hidden="true" />}
        >
          <ul className={styles.facts}>
            {career.series && (
              <li>
                <Trans>
                  Regular at <strong>{career.series.name}</strong> (
                  {career.series.count} times)
                </Trans>
              </li>
            )}
            {weekdayName && (
              <li>
                <Trans>
                  <strong>{weekdayName}</strong> is your tournament day
                </Trans>
              </li>
            )}
            {career.biggestBracket && (
              <li>
                <Trans>
                  Biggest bracket:{" "}
                  <strong>{career.biggestBracket.numEntrants} entrants</strong>{" "}
                  at {career.biggestBracket.tournament.name}
                </Trans>
              </li>
            )}
          </ul>
        </Tile>
      )}

      {setsLoading && (
        <div
          className={cn(styles.tile, styles.pending)}
          style={{ "--i": index++ } as React.CSSProperties}
        >
          <Trans>Going through your recent sets...</Trans>
        </div>
      )}

      {setStats.winPercent !== null && (
        <>
          <Tile
            index={index++}
            label={<Trans>Recent sets</Trans>}
            icon={<FaBolt aria-hidden="true" />}
            className={styles.ringTile}
          >
            <WinRing percent={setStats.winPercent} />
            <p className={styles.caption}>
              <Trans>
                <strong>
                  {setStats.wins}–{setStats.losses}
                </strong>{" "}
                over your last {setStats.setCount} sets
              </Trans>
            </p>
          </Tile>

          <Tile
            index={index++}
            label={<Trans>Last-game sets</Trans>}
            icon={<FaFire aria-hidden="true" />}
          >
            <span className={styles.number}>
              {setStats.deciders.wins}–{setStats.deciders.losses}
            </span>
            <RecordBar
              wins={setStats.deciders.wins}
              losses={setStats.deciders.losses}
            />
            <p className={styles.caption}>
              <Trans>
                when it goes the distance. Best win streak:{" "}
                {setStats.longestWinStreak}
              </Trans>
            </p>
          </Tile>

          {(setStats.rival ||
            setStats.nemesis ||
            setStats.favoriteOpponent) && (
            <Tile
              index={index++}
              wide
              label={<Trans>Familiar faces</Trans>}
              icon={<FaUserGroup aria-hidden="true" />}
            >
              {setStats.rival && (
                <MatchupLine
                  title={<Trans>Rival</Trans>}
                  matchup={setStats.rival}
                />
              )}
              {setStats.nemesis && (
                <MatchupLine
                  title={<Trans>Nemesis</Trans>}
                  matchup={setStats.nemesis}
                />
              )}
              {setStats.favoriteOpponent && (
                <MatchupLine
                  title={<Trans>Never lost to</Trans>}
                  matchup={setStats.favoriteOpponent}
                />
              )}
            </Tile>
          )}

          {setStats.characters.length > 0 && (
            <Tile
              index={index++}
              wide
              label={<Trans>Mains</Trans>}
              icon={<FaMedal aria-hidden="true" />}
            >
              <ul className={styles.characters}>
                {setStats.characters.map((character, i) => (
                  <li key={character.id} className={styles.character}>
                    <img
                      src={getCharImgUrl({
                        characterId: character.id,
                        type: "stock",
                      })}
                      alt=""
                      loading="lazy"
                    />
                    <span className={styles.characterName}>
                      {getCharacterDisplayName(character.id, i18n.locale)}
                    </span>
                    <span className={styles.characterBar} aria-hidden="true">
                      <span
                        style={
                          {
                            "--fill": `${(character.games / totalCharacterGames) * 100}%`,
                            "--bar": i,
                          } as React.CSSProperties
                        }
                      />
                    </span>
                    <span className={styles.characterGames}>
                      <Trans>{character.games} games</Trans>
                    </span>
                  </li>
                ))}
              </ul>
            </Tile>
          )}
        </>
      )}
    </div>
  );
};
