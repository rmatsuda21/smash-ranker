import { useMemo, useState } from "react";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { FaChevronRight } from "react-icons/fa6";

import { Input } from "@/components/shared/Input/Input";
import { useResultsStore } from "@/store/resultsStore";
import type { ResultsEntrantSummary } from "@/types/results/ResultsEntrantSummary";

import styles from "./EntrantPicker.module.scss";

type Props = {
  onSelect: (entrant: ResultsEntrantSummary) => void;
};

export const EntrantPicker = ({ onSelect }: Props) => {
  const { _ } = useLingui();
  const [search, setSearch] = useState("");
  const entrantPool = useResultsStore((s) => s.entrantPool);
  const selectedEntrantId = useResultsStore((s) => s.selectedEntrantId);
  const fetchingResults = useResultsStore((s) => s.fetchingResults);

  const filtered = useMemo(() => {
    if (!search.trim()) return entrantPool;
    const q = search.toLowerCase();
    return entrantPool.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.prefix && p.prefix.toLowerCase().includes(q)),
    );
  }, [entrantPool, search]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Trans>Pick a player</Trans>
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
        {filtered.map((entrant) => {
          const isSelected = selectedEntrantId === entrant.id;
          const isLoading = isSelected && fetchingResults;
          return (
            <button
              key={entrant.id}
              className={styles.item}
              data-selected={isSelected || undefined}
              disabled={fetchingResults}
              onClick={() => onSelect(entrant)}
            >
              <span className={styles.seed}>#{entrant.seed}</span>
              {entrant.country && (
                <img
                  className={styles.flag}
                  src={`/assets/flags/${entrant.country.toLowerCase()}.svg`}
                  alt=""
                  aria-hidden="true"
                />
              )}
              <span className={styles.name}>
                {entrant.prefix && (
                  <span className={styles.prefix}>{entrant.prefix} | </span>
                )}
                {entrant.name}
              </span>
              {isLoading ? (
                <span className={styles.loading}>…</span>
              ) : (
                <FaChevronRight className={styles.chevron} />
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className={styles.empty}>
            <Trans>No players found</Trans>
          </p>
        )}
      </div>
    </div>
  );
};
