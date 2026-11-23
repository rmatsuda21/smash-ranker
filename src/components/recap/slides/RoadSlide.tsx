import { useCallback, useState, type CSSProperties } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { RecapGlobe } from "@/components/recap/RecapGlobe";
import { useRecapStory } from "@/components/recap/RecapStory/RecapStoryContext";
import type { Recap } from "@/types/recap/Recap";
import { countryName, fitSize, weekdayName } from "@/utils/recap/recapText";
import { formatOrdinal } from "@/utils/user/ordinal";

import styles from "../recap.module.scss";

const EARTH_KM = 40075;

export const RoadSlide = ({ recap }: { recap: Recap }) => {
  const { _, i18n } = useLingui();
  const story = useRecapStory();
  const [exploring, setExploring] = useState(false);
  const [selected, setSelected] = useState(-1);
  const handleSelect = useCallback((index: number) => setSelected(index), []);

  const setMode = (on: boolean) => {
    setExploring(on);
    setSelected(-1);
    story.setLocked(on);
  };

  const cities = recap.cities.length;
  const countries = recap.countryCount;
  const distance = recap.distanceKm.toLocaleString(i18n.locale);
  const laps = (recap.distanceKm / EARTH_KM).toFixed(1);
  const home = recap.cities[0].name;
  const weekday = recap.weekday
    ? weekdayName(recap.weekday.day, i18n.locale)
    : "";
  const offline = recap.offlinePercent;

  const city = recap.cities[selected];
  const cityCount = city?.count ?? 0;
  const cityBest = city?.best ? formatOrdinal(city.best, i18n.locale) : "";
  const citiesLine = _(msg`${cities} cities`);
  const countriesLine = _(msg`${countries} countries`);

  return (
    <section
      className={cn(styles.slide, styles.gInk, exploring && styles.exploring)}
    >
      <div className={styles.roadHead}>
        <p className={cn(styles.kicker, styles.rise)}>
          <Trans>On the road</Trans>
        </p>
        <p
          className={cn(styles.disp, styles.roadNum, styles.rise)}
          style={
            {
              "--i": 1,
              "--fs": `${Math.min(fitSize(citiesLine, 19, 84), fitSize(countriesLine, 19, 84))}cqw`,
            } as CSSProperties
          }
        >
          {citiesLine}
          <br />
          {countriesLine}
        </p>
      </div>

      <div className={styles.globeWrap}>
        <RecapGlobe
          cities={recap.cities}
          restView={recap.restView}
          exploring={exploring}
          selected={selected}
          onSelect={handleSelect}
          label={_(
            msg`Globe with routes from ${home} to the cities you played in`,
          )}
        />
      </div>

      <div className={styles.roadFoot}>
        <p className={styles.rise} style={{ "--i": 20 } as CSSProperties}>
          <Trans>
            <b>About {distance} km travelled.</b> That is {laps} laps of the
            planet.
          </Trans>{" "}
          {weekday && (
            <Trans>
              {home} is home turf; {weekday} is your day.
            </Trans>
          )}
        </p>
        <div
          className={cn(styles.split, styles.rise)}
          style={{ "--i": 22 } as CSSProperties}
        >
          <b style={{ width: `${offline}%` }}>
            <Trans>{offline}% offline</Trans>
          </b>
          {offline < 100 && (
            <span>
              <Trans>online</Trans>
            </span>
          )}
        </div>
        <button
          type="button"
          className={cn(styles.exploreBtn, styles.rise)}
          style={{ "--i": 24 } as CSSProperties}
          onClick={() => setMode(true)}
        >
          <Trans>Explore the globe</Trans>
        </button>
      </div>

      {exploring && (
        <>
          <p className={styles.exHint}>
            <Trans>Drag to spin · pinch or double-tap to zoom</Trans>
          </p>
          <button
            type="button"
            className={styles.exDone}
            onClick={() => setMode(false)}
          >
            <Trans>Done</Trans>
          </button>
          <div className={styles.cityCard}>
            {city ? (
              <>
                <b>
                  {city.name} · {countryName(city.countryCode, i18n.locale)}
                </b>
                <br />
                {cityBest ? (
                  <Trans>
                    {cityCount} tournaments · best finish {cityBest}
                  </Trans>
                ) : (
                  <Trans>{cityCount} tournaments</Trans>
                )}
              </>
            ) : (
              <Trans>Tap a pin to see what you did in that city.</Trans>
            )}
          </div>
        </>
      )}
    </section>
  );
};
