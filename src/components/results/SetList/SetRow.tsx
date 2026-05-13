import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import type {
  CharacterRef,
  PlayerSet,
} from "@/types/results/PlayerTournamentResults";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { upsetTier } from "@/utils/results/upsetFactor";

import styles from "./SetRow.module.scss";

const UPSET_TIER_CLASS = {
  minor: styles.upsetMinor,
  notable: styles.upsetNotable,
  major: styles.upsetMajor,
  legendary: styles.upsetLegendary,
};

const CharacterStack = ({
  characters,
  fallbackId,
}: {
  characters: CharacterRef[];
  fallbackId: string | null | undefined;
}) => {
  const { _ } = useLingui();
  if (characters.length > 0) {
    return (
      <span className={styles.charStack}>
        {characters.slice(0, 3).map((c) => (
          <img
            key={c.id}
            className={styles.charImg}
            src={getCharImgUrl({ characterId: c.id, type: "stock" })}
            alt={c.name}
            title={c.name}
          />
        ))}
      </span>
    );
  }
  if (fallbackId === undefined) {
    return (
      <span
        className={cn(styles.charPlaceholder, styles.charPlaceholderLoading)}
        aria-label={_(msg`Loading character`)}
      />
    );
  }
  if (fallbackId) {
    return (
      <span className={styles.charStack}>
        <img
          className={`${styles.charImg} ${styles.charImgFallback}`}
          src={getCharImgUrl({ characterId: fallbackId, type: "stock" })}
          alt=""
          aria-hidden="true"
        />
      </span>
    );
  }
  const noCharacterData = _(msg`No character data`);
  return (
    <span
      className={styles.charEmpty}
      aria-label={noCharacterData}
      title={noCharacterData}
    />
  );
};

const ordinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

type Props = {
  set: PlayerSet;
  selfFallbackCharacterId: string | null | undefined;
  opponentFallbackCharacterId: string | null | undefined;
};

export const SetRow = ({
  set,
  selfFallbackCharacterId,
  opponentFallbackCharacterId,
}: Props) => {
  const hasUpset = set.upsetFactor !== undefined && set.upsetFactor > 0;
  const upsetClass = hasUpset
    ? UPSET_TIER_CLASS[upsetTier(set.upsetFactor!)]
    : null;

  const meta =
    set.opponent.seed && set.opponent.placement
      ? `(#${set.opponent.seed} → ${set.opponent.placement}${ordinal(set.opponent.placement)})`
      : set.opponent.seed
        ? `(#${set.opponent.seed})`
        : "";

  return (
    <div
      className={cn(styles.root, set.didWin ? styles.win : styles.loss)}
      data-dq={set.isDQ || undefined}
    >
      {/* Row 1: round label, centered */}
      <div className={styles.round}>{set.fullRoundText || "—"}</div>

      {/* Row 2: chars · score · chars. 3-col flex with equal `flex: 1 1 0`
          sides keeps the score at the exact horizontal midpoint of the card,
          regardless of how many character icons each side has. */}
      <div className={styles.mainRow}>
        <div className={cn(styles.charSide, styles.charSideLeft)}>
          <CharacterStack
            characters={set.selfCharacters}
            fallbackId={selfFallbackCharacterId}
          />
        </div>
        {set.isDQ ? (
          <span className={styles.dq}>
            <Trans>DQ</Trans>
          </span>
        ) : (
          <span className={styles.score}>
            {set.scoreSelf} - {set.scoreOpponent}
          </span>
        )}
        <div className={cn(styles.charSide, styles.charSideRight)}>
          <CharacterStack
            characters={set.opponent.characters}
            fallbackId={opponentFallbackCharacterId}
          />
        </div>
      </div>

      {/* Row 3: inline opponent info on the left, UF badge on the right. */}
      <div className={styles.footerRow}>
        <span className={styles.opponentLine}>
          <span className={styles.vs}>
            <Trans>vs</Trans>
          </span>
          {set.opponent.country && (
            <img
              className={styles.flag}
              src={`/assets/flags/${set.opponent.country.toLowerCase()}.svg`}
              alt=""
              aria-hidden="true"
            />
          )}
          <span className={styles.opponentName}>
            {set.opponent.prefix && (
              <span className={styles.prefix}>{set.opponent.prefix} | </span>
            )}
            {set.opponent.name}
          </span>
          {meta && <span className={styles.opponentMeta}>{meta}</span>}
          {set.opponent.topRanking && (
            <span
              className={styles.rankingPill}
              title={`${set.opponent.topRanking.title} #${set.opponent.topRanking.rank}`}
            >
              {set.opponent.topRanking.displayTitle ??
                set.opponent.topRanking.title}{" "}
              #{set.opponent.topRanking.rank}
            </span>
          )}
        </span>
        {hasUpset && (
          <span className={cn(styles.upset, upsetClass)}>
            UF {set.upsetFactor}
          </span>
        )}
      </div>
    </div>
  );
};
