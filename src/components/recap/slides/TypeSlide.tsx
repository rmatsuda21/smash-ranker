import type { CSSProperties } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { TypeEmblem } from "@/components/recap/TypeEmblem";
import {
  PLAYER_TYPES,
  type PlayerTypeDefinition,
} from "@/consts/recap/playerTypes";
import type { Recap } from "@/types/recap/Recap";
import { fitSize } from "@/utils/recap/recapText";
import { getCharacter } from "@/utils/top8/characterCatalog";

import styles from "../recap.module.scss";

const colors = (type: PlayerTypeDefinition) =>
  ({ "--bg": type.bg, "--fg": type.fg, "--a": type.accent }) as CSSProperties;

// Why the player got their type, in their own numbers.
const Reason = ({ recap }: { recap: Recap }) => {
  const { i18n } = useLingui();
  const main = recap.characters[0];
  const character = main ? getCharacter(main.id) : undefined;
  const mainName =
    (i18n.locale.startsWith("ja") && character?.nameJa) ||
    character?.name ||
    "";
  const mainGames = main?.games ?? 0;
  const recorded = recap.recordedGames;
  const characters = recap.characterCount;
  const deciderWins = recap.deciders.wins;
  const deciders = recap.deciders.wins + recap.deciders.losses;
  const home = recap.cities.find((city) => city.isHome);
  const homeName = home?.name ?? "";
  const homeCount = home?.count ?? 0;
  const cities = recap.cities.length;
  const countries = recap.countryCount;
  const distance = recap.distanceKm.toLocaleString(i18n.locale);
  const weeks = recap.streak.length;
  const upsets = recap.upsetCount;

  switch (recap.type) {
    case "loyal":
      return (
        <Trans>
          {mainGames} of your {recorded} recorded games were on {mainName}.
          Nobody else got a look in.
        </Trans>
      );
    case "lab":
      return (
        <Trans>
          {characters} different characters each took at least 5% of your games.
        </Trans>
      );
    case "closer":
      return (
        <Trans>
          Last game, last stock. You won {deciderWins} of the {deciders} sets
          that went the distance.
        </Trans>
      );
    case "local":
      return (
        <Trans>
          {homeCount} tournaments in {homeName}. Everyone there knows your name.
        </Trans>
      );
    case "road":
      return (
        <Trans>
          {cities} cities in {countries} countries, about {distance} km on the
          road.
        </Trans>
      );
    case "iron":
      return (
        <Trans>{weeks} weeks in a row without missing a tournament.</Trans>
      );
    case "slayer":
      return (
        <Trans>{upsets} upsets this year. Seeds mean nothing to you.</Trans>
      );
    case "rookie":
      return <Trans>Your first year of brackets, and you showed up.</Trans>;
    default:
      return (
        <Trans>
          You beat the players you are meant to beat, and very few get past you.
        </Trans>
      );
  }
};

export const TypeSlide = ({ recap }: { recap: Recap }) => {
  const { _ } = useLingui();

  const index = Math.max(
    0,
    PLAYER_TYPES.findIndex((type) => type.id === recap.type),
  );
  const type = PLAYER_TYPES[index];
  const name = _(type.name);
  const lines = name.split(" ");
  const year = recap.year;

  return (
    <section className={cn(styles.slide, styles.gBlue, styles.type)}>
      <p className={cn(styles.kicker, styles.rise)}>
        <Trans>Your {year} player type</Trans>
      </p>
      <div className={styles.card}>
        <div className={cn(styles.face, styles.faceBack)} />
        <div className={cn(styles.face, styles.faceFront)} style={colors(type)}>
          <p className={styles.typeNo}>
            <span>
              <Trans>Player type</Trans>
            </span>
            <span>
              {index + 1} / {PLAYER_TYPES.length}
            </span>
          </p>
          <div
            className={styles.emb}
            style={
              { "--emb": lines.length > 1 ? "38cqw" : "48cqw" } as CSSProperties
            }
          >
            <TypeEmblem type={type.id} />
          </div>
          <p
            className={cn(styles.disp, styles.typeName)}
            style={
              {
                "--fs": `${Math.min(...lines.map((line) => fitSize(line, 19, 64)))}cqw`,
              } as CSSProperties
            }
          >
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
          <p className={styles.why}>
            <Reason recap={recap} />
          </p>
          <div className={styles.foil} />
        </div>
      </div>
      <div className={styles.minis} aria-hidden="true">
        {PLAYER_TYPES.map((other, i) => (
          <i
            key={other.id}
            className={cn(i === index && styles.miniMe)}
            style={{ ...colors(other), "--w": i } as CSSProperties}
          >
            <TypeEmblem type={other.id} />
          </i>
        ))}
      </div>
    </section>
  );
};
