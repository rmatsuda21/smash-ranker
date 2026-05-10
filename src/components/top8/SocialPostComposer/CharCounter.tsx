import cn from "classnames";

import styles from "./SocialPostComposer.module.scss";

type Props = {
  count: number;
  limit: number;
};

export const CharCounter = ({ count, limit }: Props) => {
  const remaining = limit - count;
  const isOver = count > limit;
  const isWarning = !isOver && remaining <= 20;

  return (
    <span
      className={cn(styles.charCounter, {
        [styles.charCounterWarning]: isWarning,
        [styles.charCounterOver]: isOver,
      })}
      aria-live="polite"
    >
      {count} / {limit}
    </span>
  );
};
