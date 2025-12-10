import cn from "classnames";

import styles from "./TabNav.module.scss";

type Props<T extends string> = {
  className?: string;
  tabs: {
    label: string;
    value: T;
  }[];
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
    <div className={cn(styles.wrapper, className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={cn(styles.tab, {
            [styles.active]: activeTab === tab.value,
          })}
          onClick={() => onTabChange(tab.value)}
        >
          <div>{tab.label}</div>
        </button>
      ))}
    </div>
  );
};
