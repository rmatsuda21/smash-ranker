import { type ReactNode } from "react";
import cn from "classnames";

import styles from "./Badge.module.scss";

export type BadgeVariant = "new" | "info" | "status";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export const Badge = ({ variant = "new", children, className }: BadgeProps) => {
  return (
    <span className={cn(styles.badge, styles[variant], className)}>
      {variant === "status" && (
        <span className={styles.dot} aria-hidden="true" />
      )}
      {children}
    </span>
  );
};
