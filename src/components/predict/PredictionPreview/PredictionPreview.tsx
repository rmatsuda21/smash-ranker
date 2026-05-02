import { useEffect, useState, type RefObject } from "react";
import cn from "classnames";

import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { type MessageDescriptor } from "@lingui/core";

import { usePredictionStore } from "@/store/predictionStore";
import { ExportBar } from "@/components/predict/ExportBar/ExportBar";

import styles from "./PredictionPreview.module.scss";

export type PredictionPreviewCache = {
  key: string;
  blob: Blob;
  url: string;
};

type Props = {
  cacheRef: RefObject<PredictionPreviewCache | null>;
};

const TAGLINES: MessageDescriptor[] = [
  msg`Consulting Master Hand...`,
  msg`Reading the tea leaves...`,
  msg`Polishing trophies...`,
  msg`Calculating upset odds...`,
  msg`Locking in picks...`,
  msg`Calling it for the record...`,
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const PredictionPreview = ({ cacheRef }: Props) => {
  const { _ } = useLingui();
  const tournamentName = usePredictionStore((s) => s.tournamentName);
  const eventName = usePredictionStore((s) => s.eventName);
  const tournamentDate = usePredictionStore((s) => s.tournamentDate);
  const tournamentIconUrl = usePredictionStore((s) => s.tournamentIconUrl);
  const predictions = usePredictionStore((s) => s.predictions);

  const payload = {
    tournamentName,
    eventName,
    tournamentDate,
    tournamentIconUrl,
    predictions: predictions.map((p) => ({
      id: p.id,
      name: p.name,
      prefix: p.prefix,
      characterId: p.characterId,
    })),
  };
  const cacheKey = JSON.stringify(payload);

  const cached = cacheRef.current?.key === cacheKey ? cacheRef.current : null;

  const [imageUrl, setImageUrl] = useState<string | null>(cached?.url ?? null);
  const [blob, setBlob] = useState<Blob | null>(cached?.blob ?? null);
  const [error, setError] = useState(false);

  useEffect(() => {
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

    const generate = async () => {
      try {
        const res = await fetch("/api/prediction-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: cacheKey,
        });

        if (!res.ok || cancelled) {
          if (!cancelled) setError(true);
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
      } catch {
        if (!cancelled) setError(true);
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, cacheRef]);

  const isLoading = !imageUrl && !error;
  const [taglineIdx, setTaglineIdx] = useState(0);
  useEffect(() => {
    if (!isLoading) return;
    if (prefersReducedMotion()) return;
    const id = setInterval(
      () => setTaglineIdx((i) => (i + 1) % TAGLINES.length),
      1700,
    );
    return () => clearInterval(id);
  }, [isLoading]);

  if (error) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingCard}>
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
          <img
            className={styles.image}
            src={imageUrl}
            alt="Prediction graphic"
          />
        </div>
        <ExportBar blob={blob} />
      </>
    );
  }

  const visiblePredictions = predictions.slice(0, 8);

  return (
    <div className={styles.loading}>
      <div className={styles.loadingCard}>
        <div className={styles.shimmer} aria-hidden="true" />
        <div className={styles.headerRow}>
          <span className={styles.eyebrow}>
            <Trans>Generating prediction</Trans>
          </span>
          <div className={styles.tagline} aria-live="polite">
            <span key={taglineIdx} className={styles.taglineText}>
              {_(TAGLINES[taglineIdx])}
            </span>
          </div>
        </div>
        <ol className={styles.predictionList}>
          {visiblePredictions.map((p, i) => (
            <li
              key={p.id}
              className={styles.predictionRow}
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <span
                className={cn(
                  styles.placement,
                  i === 0 && styles.gold,
                  i === 1 && styles.silver,
                  i === 2 && styles.bronze,
                )}
              >
                {i + 1}
              </span>
              <span className={styles.name}>
                {p.prefix && <span className={styles.prefix}>{p.prefix} </span>}
                {p.name}
              </span>
              <span className={styles.rowShine} aria-hidden="true" />
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
