import cn from "classnames";

import styles from "./TabNav.module.scss";

type Props<T extends string> = {
  className?: string;
  tabs: Record<T, string>;
  activeTab?: T;
  onTabChange: (value: T) => void;
};

export const TabNav = <T extends string>({
  className,
  tabs,
  activeTab,
  onTabChange,
}: Props<T>) => {
  return (
    <div className={cn(styles.tabNav, className)}>
      {Object.entries(tabs).map(([key, value]) => (
        <button
          key={key}
          className={cn(styles.tab, {
            [styles.active]: activeTab === key,
          })}
          onClick={() => onTabChange(key as T)}
        >
          <div className={styles.label}>{value as string}</div>
        </button>
      ))}
    </div>
  );
};
