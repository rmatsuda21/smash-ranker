import cn from "classnames";

import { Spinner } from "@/components/shared/Spinner/Spinner";
import { useTooltip } from "@/hooks/top8/useTooltip";

import styles from "./Button.module.scss";

type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type Props = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  tooltip?: string;
};

export const Button = ({
  className,
  variant = "solid",
  size = "md",
  fullWidth = false,
  children,
  loading = false,
  disabled = false,
  tooltip,
  ...props
}: Props) => {
  const { Tooltip, handleMouseEnter, handleMouseLeave } = useTooltip({
    tooltip: tooltip ?? "",
  });
  return (
    <>
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          styles.button,
          styles[variant],
          styles[size],
          { [styles.fullWidth]: fullWidth },
          { [styles.loading]: loading },
          className
        )}
        disabled={loading || disabled}
        aria-label={tooltip}
        {...props}
      >
        {loading && <Spinner className={styles.loader} size={15} />}
        {children}
        {tooltip && <Tooltip className={styles.tooltip} />}
      </button>
    </>
  );
};
