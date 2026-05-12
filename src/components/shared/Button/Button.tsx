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
  // Optional label shown next to the spinner while loading. When provided,
  // the spinner sits inline before the text (instead of as an overlay
  // hiding the resting children), so users get a status message — e.g.
  // "Fetching opponent data..." — without losing the spinner cue.
  loadingText?: React.ReactNode;
  tooltip?: string;
};

export const Button = ({
  className,
  variant = "solid",
  size = "md",
  fullWidth = false,
  children,
  loading = false,
  loadingText,
  disabled = false,
  tooltip,
  ...props
}: Props) => {
  const { Tooltip, handleMouseEnter, handleMouseLeave } = useTooltip({
    tooltip: tooltip ?? "",
  });
  const showInlineLoading = loading && loadingText !== undefined;
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
          { [styles.loading]: loading && !showInlineLoading },
          { [styles.loadingInline]: showInlineLoading },
          className,
        )}
        disabled={loading || disabled}
        aria-label={tooltip}
        {...props}
      >
        {loading && (
          <Spinner
            className={cn(
              styles.loader,
              showInlineLoading && styles.loaderInline,
            )}
            size={15}
          />
        )}
        {showInlineLoading ? loadingText : children}
        {tooltip && <Tooltip className={styles.tooltip} />}
      </button>
    </>
  );
};
