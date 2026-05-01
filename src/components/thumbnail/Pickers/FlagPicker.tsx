import { useMemo, useState } from "react";

import { FLAG_CODES } from "@/consts/thumbnail/flagCodes";

import styles from "./FlagPicker.module.scss";

type Props = {
  selected: string;
  onSelect: (code: string) => void;
};

export const FlagPicker = ({ selected, onSelect }: Props) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FLAG_CODES;
    return FLAG_CODES.filter(
      (entry) =>
        entry.code.toLowerCase().includes(q) ||
        entry.name.toLowerCase().includes(q),
    );
  }, [query]);

  const lower = selected.toLowerCase();

  return (
    <div className={styles.root}>
      <input
        type="search"
        className={styles.search}
        placeholder="Search flags…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={styles.grid}>
        {filtered.map((entry) => (
          <button
            key={entry.code}
            className={
              lower === entry.code.toLowerCase()
                ? `${styles.flag} ${styles.selected}`
                : styles.flag
            }
            onClick={() => onSelect(entry.code)}
            title={entry.name}
            type="button"
          >
            <img
              src={`/assets/flags/${entry.code.toLowerCase()}.svg`}
              alt={entry.name}
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
