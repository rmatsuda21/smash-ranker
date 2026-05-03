import cn from "classnames";

import styles from "./BracketLoader.module.scss";

type Props = {
  className?: string;
  size?: number;
  label?: string;
};

// Animated single-elimination bracket: 8 → 4 → 2 → 1.
// Lines draw in round-by-round, the trophy slot pops with a glow when the
// "tournament" finishes, then it loops. Themed around what the app exists
// to make: tournament graphics.
export const BracketLoader = ({
  className,
  size = 280,
  label = "Building your bracket",
}: Props) => {
  const style = { "--loader-size": `${size}px` } as React.CSSProperties;

  return (
    <div className={cn(styles.wrapper, className)} style={style}>
      <svg
        viewBox="0 0 200 144"
        className={styles.bracket}
        role="img"
        aria-label={label}
      >
        <g className={cn(styles.lines, styles.r1)}>
          <path d="M17 8 H42 V16 H67" pathLength="100" />
          <path d="M17 24 H42 V16 H67" pathLength="100" />
          <path d="M17 40 H42 V48 H67" pathLength="100" />
          <path d="M17 56 H42 V48 H67" pathLength="100" />
          <path d="M17 72 H42 V80 H67" pathLength="100" />
          <path d="M17 88 H42 V80 H67" pathLength="100" />
          <path d="M17 104 H42 V112 H67" pathLength="100" />
          <path d="M17 120 H42 V112 H67" pathLength="100" />
        </g>
        <g className={cn(styles.lines, styles.r2)}>
          <path d="M73 16 H98 V32 H123" pathLength="100" />
          <path d="M73 48 H98 V32 H123" pathLength="100" />
          <path d="M73 80 H98 V96 H123" pathLength="100" />
          <path d="M73 112 H98 V96 H123" pathLength="100" />
        </g>
        <g className={cn(styles.lines, styles.r3)}>
          <path d="M129 32 H154 V64 H179" pathLength="100" />
          <path d="M129 96 H154 V64 H179" pathLength="100" />
        </g>

        <g className={cn(styles.nodes, styles.r1)}>
          <circle cx="14" cy="8" r="4" />
          <circle cx="14" cy="24" r="4" />
          <circle cx="14" cy="40" r="4" />
          <circle cx="14" cy="56" r="4" />
          <circle cx="14" cy="72" r="4" />
          <circle cx="14" cy="88" r="4" />
          <circle cx="14" cy="104" r="4" />
          <circle cx="14" cy="120" r="4" />
        </g>
        <g className={cn(styles.nodes, styles.r2)}>
          <circle cx="70" cy="16" r="4" />
          <circle cx="70" cy="48" r="4" />
          <circle cx="70" cy="80" r="4" />
          <circle cx="70" cy="112" r="4" />
        </g>
        <g className={cn(styles.nodes, styles.r3)}>
          <circle cx="126" cy="32" r="4" />
          <circle cx="126" cy="96" r="4" />
        </g>

        <circle cx="182" cy="64" r="6" className={styles.winner} />
        <path
          d="M177 59 L182 53 L187 59 L185 59 L185 64 L179 64 L179 59 Z"
          className={styles.crown}
        />
      </svg>
      {label ? <p className={styles.label}>{label}</p> : null}
    </div>
  );
};
