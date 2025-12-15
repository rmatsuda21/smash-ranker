import cn from "classnames";
import { Spinner } from "@radix-ui/themes";

import styles from "./Button.module.scss";

type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type Props = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
};

export const Button = ({
  className,
  variant = "solid",
  size = "md",
  fullWidth = false,
  children,
  loading = false,
  disabled = false,
  ...props
}: Props) => {
  return (
    <button
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        { [styles.fullWidth]: fullWidth },
        { [styles.loading]: loading },
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Spinner className={styles.loader} size="3" />}
      {children}
    </button>
  );
};
