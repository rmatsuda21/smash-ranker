import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import cn from "classnames";

import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { type MessageDescriptor } from "@lingui/core";

import { useResultsStore } from "@/store/resultsStore";
import { ResultsExportBar } from "@/components/results/ResultsExportBar/ResultsExportBar";
import type { PredictionPalette } from "@/types/predict/PredictionPalette";
import type { PlayerTournamentResults } from "@/types/results/PlayerTournamentResults";
import { logEvent, logWarning } from "@/utils/observability/log";

import styles from "./ResultsPreview.module.scss";

const paletteToStyleVars = (palette: PredictionPalette): CSSProperties =>
  ({
    "--pg-bg-start": palette.bgGradientStart,
    "--pg-bg-end": palette.bgGradientEnd,
    "--pg-accent": palette.accent,
    "--pg-accent-bg": palette.accentRowBg,
    "--pg-text-1": palette.textPrimary,
    "--pg-text-2": palette.textSecondary,
    "--pg-text-muted": palette.textMuted,
    "--pg-text-foot": palette.textFooter,
    "--pg-border": palette.borderSubtle,
  }) as CSSProperties;

const base64urlEncode = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export type ResultsPreviewCache = {
  key: string;
  blob: Blob;
  url: string;
};

type Props = {
  cacheRef: RefObject<ResultsPreviewCache | null>;
};

const TAGLINES: MessageDescriptor[] = [
  msg`Replaying the bracket...`,
  msg`Counting stocks...`,
  msg`Tallying the damage...`,
  msg`Drawing the matchups...`,
  msg`Locking in the recap...`,
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const buildPayload = (
  tournamentName: string,
  eventName: string,
  tournamentDate: string,
  tournamentIconUrl: string,
  tournamentCountry: string | null,
  numEntrants: number,
  palette: PredictionPalette,
  locale: string,
  player: PlayerTournamentResults,
  fallbackCharacters: Record<string, string | null>,
) => ({
  tournamentName,
  eventName,
  tournamentDate,
  tournamentIconUrl,
  tournamentCountry,
  numEntrants,
  palette,
  locale,
  player: {
    name: player.name,
    prefix: player.prefix,
    country: player.country,
    iconUrl: player.iconUrl,
    rankings: player.rankings,
    seed: player.seed,
    placement: player.placement,
    wins: player.wins,
    losses: player.losses,
  },
  fallbackCharacterId: fallbackCharacters[player.entrantId] ?? null,
  sets: player.sets.map((s) => ({
    id: s.id,
    fullRoundText: s.fullRoundText,
    scoreSelf: s.scoreSelf,
    scoreOpponent: s.scoreOpponent,
    didWin: s.didWin,
    isDQ: s.isDQ,
    upsetFactor: s.upsetFactor,
    phaseId: s.phaseId,
    phaseName: s.phaseName,
    selfCharacters: s.selfCharacters.map((c) => c.id),
    opponent: {
      name: s.opponent.name,
      prefix: s.opponent.prefix,
      country: s.opponent.country,
      topRanking: s.opponent.topRanking,
      seed: s.opponent.seed,
      placement: s.opponent.placement,
      characters: s.opponent.characters.map((c) => c.id),
      fallbackCharacterId: fallbackCharacters[s.opponent.id] ?? null,
    },
  })),
});

export const ResultsPreview = ({ cacheRef }: Props) => {
  const { _, i18n } = useLingui();
  const tournamentName = useResultsStore((s) => s.tournamentName);
  const eventName = useResultsStore((s) => s.eventName);
  const tournamentDate = useResultsStore((s) => s.tournamentDate);
  const tournamentIconUrl = useResultsStore((s) => s.tournamentIconUrl);
  const tournamentCountry = useResultsStore((s) => s.tournamentCountry);
  const numEntrants = useResultsStore((s) => s.numEntrants);
  const palette = useResultsStore((s) => s.colorPalette);
  const playerResults = useResultsStore((s) => s.playerResults);
  const fallbackCharacters = useResultsStore((s) => s.fallbackCharacters);
  const styleVars = paletteToStyleVars(palette);

  // Payload + serialized form are derived once per input change rather
  // than every render. The JSON.stringify is hot when the modal stays
  // open and the user clicks around behind it.
  const payload = useMemo(
    () =>
      playerResults
        ? buildPayload(
            tournamentName,
            eventName,
            tournamentDate,
            tournamentIconUrl,
            tournamentCountry,
            numEntrants,
            palette,
            i18n.locale,
            playerResults,
            fallbackCharacters,
          )
        : null,
    [
      playerResults,
      tournamentName,
      eventName,
      tournamentDate,
      tournamentIconUrl,
      tournamentCountry,
      numEntrants,
      palette,
      i18n.locale,
      fallbackCharacters,
    ],
  );
  const cacheKey = useMemo(
    () => (payload ? JSON.stringify(payload) : ""),
    [payload],
  );
  const requestUrl = useMemo(
    () =>
      payload && cacheKey
        ? `/api/results-image?d=${base64urlEncode(cacheKey)}`
        : "",
    [payload, cacheKey],
  );

  const cached = cacheRef.current?.key === cacheKey ? cacheRef.current : null;

  const [imageUrl, setImageUrl] = useState<string | null>(cached?.url ?? null);
  const [blob, setBlob] = useState<Blob | null>(cached?.blob ?? null);
  const [error, setError] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [taglineIdx, setTaglineIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const setCount = playerResults?.sets.length ?? 0;
  const entrantId = playerResults?.entrantId ?? null;
  const playerId = playerResults?.playerId ?? null;
  // Snapshot of identifying context for error/event logs. Lets reports
  // include the tournament URL + ids so issues can be reproduced (and so
  // upstream start.gg reports include the exact event + player).
  const tournamentUrl = useResultsStore((s) => s.tournamentUrl);
  const videogameId = useResultsStore((s) => s.videogameId);
  useEffect(() => {
    if (!requestUrl) return;
    if (cacheRef.current?.key === cacheKey) {
      setBlob(cacheRef.current.blob);
      setImageUrl(cacheRef.current.url);
      setError(false);
      return;
    }

    let cancelled = false;
    setError(false);
    setImageUrl(null);
    setBlob(null);

    // `graphic_export_start` is fired by ResultsApp on modal-open (the
    // user-intent moment); we only emit `_fail` from here so the funnel
    // pairs cleanly without double-counting `_start`s.
    const startedAt = performance.now();
    const failContext = {
      export_surface: "results" as const,
      export_format: "png" as const,
      set_count: setCount,
      tournament_url: tournamentUrl,
      videogame_id: videogameId,
      entrant_id: entrantId,
      player_id: playerId,
    };

    const generate = async () => {
      try {
        const res = await fetch(requestUrl);
        if (cancelled) return;
        if (!res.ok) {
          setError(true);
          logEvent("graphic_export_fail", {
            ...failContext,
            failure_kind: "post_process",
            status: res.status,
            duration_ms: Math.round(performance.now() - startedAt),
          });
          logWarning("results image fetch non-2xx", {
            area: "results-render",
            status: res.status,
            statusText: res.statusText,
            tournament_url: tournamentUrl,
            videogame_id: videogameId,
            entrant_id: entrantId,
            player_id: playerId,
          });
          return;
        }

        const result = await res.blob();
        if (cancelled) return;

        const url = URL.createObjectURL(result);

        if (cacheRef.current) {
          URL.revokeObjectURL(cacheRef.current.url);
        }
        cacheRef.current = { key: cacheKey, blob: result, url };

        setBlob(result);
        setImageUrl(url);
      } catch (err) {
        if (cancelled) return;
        setError(true);
        const message = err instanceof Error ? err.message : String(err);
        logEvent("graphic_export_fail", {
          ...failContext,
          failure_kind: "query_error",
          duration_ms: Math.round(performance.now() - startedAt),
        });
        logWarning("results image fetch threw", {
          area: "results-render",
          tournament_url: tournamentUrl,
          videogame_id: videogameId,
          entrant_id: entrantId,
          player_id: playerId,
          error: message,
        });
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [
    cacheKey,
    requestUrl,
    cacheRef,
    setCount,
    tournamentUrl,
    videogameId,
    entrantId,
    playerId,
  ]);

  useEffect(() => {
    if (!imageUrl) return;
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setAtBottom(entry.isIntersecting),
      { root, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [imageUrl]);

  const isLoading = !imageUrl && !error;
  useEffect(() => {
    if (!isLoading) return;
    if (prefersReducedMotion()) return;
    const id = setInterval(
      () => setTaglineIdx((i) => (i + 1) % TAGLINES.length),
      1700,
    );
    return () => clearInterval(id);
  }, [isLoading]);

  if (!playerResults) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingCard} style={styleVars}>
          <p className={styles.loadingText}>
            <Trans>Select a player first.</Trans>
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingCard} style={styleVars}>
          <p className={styles.loadingText}>
            <Trans>Failed to generate image</Trans>
          </p>
        </div>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <>
        <div className={styles.imageWrapper}>
          <div className={styles.scrollArea} ref={scrollRef}>
            <img
              className={styles.image}
              src={imageUrl}
              alt={_(msg`Tournament results graphic`)}
            />
            <div ref={sentinelRef} className={styles.scrollSentinel} />
          </div>
          <div
            className={cn(
              styles.scrollFade,
              atBottom && styles.scrollFadeHidden,
            )}
            aria-hidden="true"
          />
        </div>
        <ResultsExportBar blob={blob} />
      </>
    );
  }

  const skeletonSets = playerResults.sets.slice(0, 5);

  return (
    <div className={styles.loading}>
      <div className={styles.loadingCard} style={styleVars}>
        <div className={styles.shimmer} aria-hidden="true" />
        <div className={styles.headerRow}>
          <span className={styles.eyebrow}>
            <Trans>Generating recap</Trans>
          </span>
          <div className={styles.tagline} aria-live="polite">
            <span key={taglineIdx} className={styles.taglineText}>
              {_(TAGLINES[taglineIdx])}
            </span>
          </div>
        </div>
        <ol className={styles.skeletonList}>
          {skeletonSets.map((s, i) => (
            <li
              key={s.id}
              className={styles.skeletonRow}
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <span className={styles.skeletonChip} />
              <span className={styles.skeletonText} />
              <span className={styles.skeletonScore} />
            </li>
          ))}
        </ol>
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} />
        </div>
      </div>
    </div>
  );
};
