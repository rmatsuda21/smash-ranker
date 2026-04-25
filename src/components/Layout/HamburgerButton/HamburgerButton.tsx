import cn from "classnames";

import styles from "./HamburgerButton.module.scss";

type Props = {
  isOpen: boolean;
  onClick: () => void;
};

export const HamburgerButton = ({ isOpen, onClick }: Props) => {
  return (
    <button
      className={cn(styles.burger, { [styles.open]: isOpen })}
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      <span className={styles.bar} />
      <span className={styles.bar} />
    </button>
  );
};
