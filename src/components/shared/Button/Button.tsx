import { useRef, useState } from "react";
import cn from "classnames";

import { Spinner } from "@/components/shared/Spinner/Spinner";

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

const TOOLTIP_DELAY = 250;

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
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const handleMouseEnter = () => {
    if (tooltip) {
      tooltipTimeout.current = setTimeout(() => {
        setShowTooltip(true);
      }, TOOLTIP_DELAY);
    }
  };

  const handleMouseLeave = () => {
    if (tooltip) {
      if (tooltipTimeout.current) {
        clearTimeout(tooltipTimeout.current);
      }
      setShowTooltip(false);
    }
  };

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
        {tooltip && (
          <div className={cn(styles.tooltip, { [styles.show]: showTooltip })}>
            {tooltip}
          </div>
        )}
      </button>
    </>
  );
};
