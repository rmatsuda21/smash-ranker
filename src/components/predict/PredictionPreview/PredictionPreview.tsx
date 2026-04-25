import { useEffect, useRef, useState } from "react";

import { Trans } from "@lingui/react/macro";

import { Spinner } from "@/components/shared/Spinner/Spinner";
import { usePredictionStore } from "@/store/predictionStore";
import { ExportBar } from "@/components/predict/ExportBar/ExportBar";

import styles from "./PredictionPreview.module.scss";

export const PredictionPreview = () => {
  const tournamentName = usePredictionStore((s) => s.tournamentName);
  const eventName = usePredictionStore((s) => s.eventName);
  const tournamentDate = usePredictionStore((s) => s.tournamentDate);
  const tournamentIconUrl = usePredictionStore((s) => s.tournamentIconUrl);
  const predictions = usePredictionStore((s) => s.predictions);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      try {
        const res = await fetch("/api/prediction-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
          }),
        });

        if (!res.ok || cancelled) {
          if (!cancelled) setError(true);
          return;
        }

        const result = await res.blob();
        if (cancelled) return;

        const url = URL.createObjectURL(result);
        blobUrlRef.current = url;
        setBlob(result);
        setImageUrl(url);
      } catch {
        if (!cancelled) setError(true);
      }
    };

    generate();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div className={styles.loading}>
      <div className={styles.loadingCard}>
        <Spinner size={28} />
        <p className={styles.loadingText}>
          <Trans>Generating image...</Trans>
        </p>
      </div>
    </div>
  );
};
