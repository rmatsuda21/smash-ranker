import { useMemo, useState } from "react";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Input } from "@/components/shared/Input/Input";
import { usePredictionStore } from "@/store/predictionStore";
import { EntrantPoolItem } from "@/components/predict/EntrantPoolItem/EntrantPoolItem";
import type { PredictionPlayer } from "@/types/predict/Prediction";

import styles from "./EntrantPoolPanel.module.scss";

export const EntrantPoolPanel = () => {
  const { _ } = useLingui();
  const [search, setSearch] = useState("");
  const entrantPool = usePredictionStore((s) => s.entrantPool);
  const predictions = usePredictionStore((s) => s.predictions);
  const predictionCount = usePredictionStore((s) => s.predictionCount);
  const customCount = usePredictionStore((s) => s.customCount);
  const dispatch = usePredictionStore((s) => s.dispatch);

  const effectiveCount =
    predictionCount === "custom" ? customCount : predictionCount;
  const isFull = predictions.length >= effectiveCount;

  const filtered = useMemo(() => {
    if (!search.trim()) return entrantPool;
    const q = search.toLowerCase();
    return entrantPool.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.prefix && p.prefix.toLowerCase().includes(q)),
    );
  }, [entrantPool, search]);

  const handleAdd = (player: PredictionPlayer) => {
    dispatch({ type: "ADD_PREDICTION", payload: player });
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Trans>Entrants</Trans>
          <span className={styles.count}>({entrantPool.length})</span>
        </h3>
      </div>
      <Input
        className={styles.search}
        type="text"
        placeholder={_(msg`Search players...`)}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      <div className={styles.list}>
        {filtered.map((player) => (
          <EntrantPoolItem
            key={player.id}
            player={player}
            disabled={isFull}
            onAdd={handleAdd}
          />
        ))}
        {filtered.length === 0 && (
          <p className={styles.empty}>
            <Trans>No players found</Trans>
          </p>
        )}
      </div>
    </div>
  );
};
