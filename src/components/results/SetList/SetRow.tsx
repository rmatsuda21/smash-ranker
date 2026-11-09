import { useState } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import type {
  CharacterRef,
  PlayerRanking,
  PlayerSet,
  PlayerSetOpponent,
} from "@/types/results/PlayerTournamentResults";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { upsetTier } from "@/utils/results/upsetFactor";
import { abbreviateRound } from "@/utils/results/abbreviateRound";
import type {
  SetListLayout,
  SetListStyle,
} from "@/types/results/SetListDisplay";

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

const VARIANT_CLASS: Record<SetListStyle, string | null> = {
  default: null,
  borderedDots: styles.variantBorderedDots,
  scoreline: styles.variantScoreline,
  gradientEdge: styles.variantGradientEdge,
};

const LAYOUT_CLASS: Record<SetListLayout, string> = {
  versus: styles.layoutVersus,
  bracket: styles.layoutBracket,
  compact: styles.layoutCompact,
};

// "#12 → 9th", or just "#12" when there is no final placement yet.
const formatSeedRun = ({
  seed,
  placement,
}: {
  seed: number;
  placement: number;
}): string => {
  if (!seed) return "";
  if (!placement) return `#${seed}`;
  return `#${seed} → ${placement}${ordinal(placement)}`;
};

const OpponentIdentity = ({ opponent }: { opponent: PlayerSetOpponent }) => (
  <>
    {opponent.country && (
      <img
        className={styles.flag}
        src={`/assets/flags/${opponent.country.toLowerCase()}.svg`}
        alt=""
        aria-hidden="true"
      />
    )}
    <span className={styles.opponentName}>
      {opponent.prefix && (
        <span className={styles.prefix}>{opponent.prefix} | </span>
      )}
      {opponent.name}
    </span>
  </>
);

// Short round label ("WSF"), with the full name on hover.
const RoundLabel = ({ text }: { text: string }) =>
  text ? <span title={text}>{abbreviateRound(text)}</span> : <>—</>;

const RankingPill = ({ ranking }: { ranking: PlayerRanking }) => (
  <span
    className={styles.rankingPill}
    title={`${ranking.title} #${ranking.rank}`}
  >
    {ranking.displayTitle ?? ranking.title} #{ranking.rank}
  </span>
);

// Upset Factor tab. Absolutely positioned inside the row's left edge so it
// never shifts the row's content.
const UpsetTab = ({ upsetFactor }: { upsetFactor: number }) => {
  const { _ } = useLingui();
  return (
    <span
      className={cn(
        styles.upset,
        styles.upsetTab,
        UPSET_TIER_CLASS[upsetTier(upsetFactor)],
      )}
      title={_(msg`Upset Factor ${upsetFactor}`)}
    >
      <span className={styles.upsetTabLabel}>UF</span>
      <span className={styles.upsetTabValue}>{upsetFactor}</span>
    </span>
  );
};

export type SetRowSelf = {
  name: string;
  seed: number;
  placement: number;
};

type Props = {
  set: PlayerSet;
  self: SetRowSelf;
  selfFallbackCharacterId: string | null | undefined;
  opponentFallbackCharacterId: string | null | undefined;
  variant?: SetListStyle;
  layout?: SetListLayout;
};

export const SetRow = ({
  set,
  self,
  selfFallbackCharacterId,
  opponentFallbackCharacterId,
  variant = "default",
  layout = "versus",
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const hasUpset = set.upsetFactor !== undefined && set.upsetFactor > 0;
  const rootProps = {
    "data-dq": set.isDQ || undefined,
    "data-upset-tier": hasUpset ? upsetTier(set.upsetFactor!) : undefined,
  };
  const upsetTab = hasUpset ? (
    <UpsetTab upsetFactor={set.upsetFactor!} />
  ) : null;

  const seedRun = formatSeedRun(set.opponent);

  const rootClass = cn(
    styles.root,
    set.didWin ? styles.win : styles.loss,
    LAYOUT_CLASS[layout],
    VARIANT_CLASS[variant],
  );

  const selfStack = (
    <CharacterStack
      characters={set.selfCharacters}
      fallbackId={selfFallbackCharacterId}
    />
  );
  const opponentStack = (
    <CharacterStack
      characters={set.opponent.characters}
      fallbackId={opponentFallbackCharacterId}
    />
  );

  if (layout === "compact") {
    return (
      <div
        className={rootClass}
        {...rootProps}
        data-expanded={expanded || undefined}
      >
        {upsetTab}
        <button
          type="button"
          className={styles.compactSummary}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className={styles.compactOutcome}>
            {set.didWin ? <Trans>W</Trans> : <Trans>L</Trans>}
          </span>
          <span className={styles.compactOpponent}>
            <OpponentIdentity opponent={set.opponent} />
          </span>
          <span className={styles.compactRound}>
            <RoundLabel text={set.fullRoundText} />
          </span>
          <span className={styles.compactScore}>
            {set.isDQ ? (
              <Trans>DQ</Trans>
            ) : (
              `${set.scoreSelf}–${set.scoreOpponent}`
            )}
          </span>
        </button>
        {expanded && (
          <div className={styles.compactDetails}>
            <span className={styles.compactChars}>
              {selfStack}
              <span className={styles.compactVs}>
                <Trans>vs</Trans>
              </span>
              {opponentStack}
            </span>
            {seedRun && <span className={styles.compactSeed}>{seedRun}</span>}
            {set.opponent.topRanking && (
              <RankingPill ranking={set.opponent.topRanking} />
            )}
          </div>
        )}
      </div>
    );
  }

  if (layout === "versus") {
    const selfSeedRun = formatSeedRun(self);
    return (
      <div className={rootClass} {...rootProps}>
        {upsetTab}
        <div className={cn(styles.versusSide, styles.versusSelf)}>
          {selfStack}
          <span className={styles.versusText}>
            <span className={styles.versusName}>
              <span className={styles.nameText}>{self.name}</span>
            </span>
            {selfSeedRun && (
              <span className={styles.versusMeta}>
                <span>{selfSeedRun}</span>
              </span>
            )}
          </span>
        </div>
        <div className={styles.versusCenter}>
          {set.isDQ ? (
            <span className={styles.dq}>
              <Trans>DQ</Trans>
            </span>
          ) : (
            <span className={styles.versusScore}>
              <span data-lit={set.didWin || undefined}>{set.scoreSelf}</span>
              <span className={styles.versusDash}>–</span>
              <span data-lit={!set.didWin || undefined}>
                {set.scoreOpponent}
              </span>
            </span>
          )}
          <span className={styles.versusRound}>
            <RoundLabel text={set.fullRoundText} />
          </span>
        </div>
        <div className={cn(styles.versusSide, styles.versusOpponent)}>
          {set.opponent.topRanking && (
            <RankingPill ranking={set.opponent.topRanking} />
          )}
          <span className={styles.versusSideRow}>
            {opponentStack}
            <span className={styles.versusText}>
              <span className={styles.versusName}>
                <OpponentIdentity opponent={set.opponent} />
              </span>
              {seedRun && (
                <span className={styles.versusMeta}>
                  <span>{seedRun}</span>
                </span>
              )}
            </span>
          </span>
        </div>
      </div>
    );
  }

  // On a DQ the score cells read W / DQ instead of numbers.
  const selfScore = set.isDQ
    ? set.didWin
      ? "W"
      : "DQ"
    : String(set.scoreSelf);
  const opponentScore = set.isDQ
    ? set.didWin
      ? "DQ"
      : "W"
    : String(set.scoreOpponent);

  return (
    <div className={rootClass} {...rootProps}>
      {upsetTab}
      <div className={styles.bracketRound}>
        <span>
          <RoundLabel text={set.fullRoundText} />
        </span>
      </div>
      <div className={styles.bracketSlots}>
        <div
          className={styles.bracketSlot}
          data-winner={set.didWin || undefined}
        >
          {selfStack}
          <span className={styles.bracketName}>
            <span className={styles.nameText}>{self.name}</span>
          </span>
          <span className={styles.bracketScore}>{selfScore}</span>
        </div>
        <div
          className={styles.bracketSlot}
          data-winner={!set.didWin || undefined}
        >
          {opponentStack}
          <span className={styles.bracketName}>
            <OpponentIdentity opponent={set.opponent} />
          </span>
          {seedRun && <span className={styles.bracketSeed}>{seedRun}</span>}
          {set.opponent.topRanking && (
            <RankingPill ranking={set.opponent.topRanking} />
          )}
          <span className={styles.bracketScore}>{opponentScore}</span>
        </div>
      </div>
    </div>
  );
};
