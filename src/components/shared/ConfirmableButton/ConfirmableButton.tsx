import { useEffect, useRef, useState, type ReactNode } from "react";
import cn from "classnames";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";

import styles from "./ConfirmableButton.module.scss";

const DEFAULT_DWELL_MS = 1500;

type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type Status = "idle" | "confirmed" | "failed";

type Props = {
  icon: ReactNode;
  label: ReactNode;
  /** Shown briefly after a successful action. Defaults to a check icon. */
  confirmIcon?: ReactNode;
  confirmLabel: ReactNode;
  /**
   * Shown briefly when the action fails (returns `false` or throws).
   * Defaults to an X-circle icon. Pair with `failLabel` to opt in to
   * the failed state — without a `failLabel`, failures stay silent (the
   * button just goes back to idle), preserving the original behavior.
   */
  failIcon?: ReactNode;
  failLabel?: ReactNode;
  /**
   * Called on click. The button shows its confirm state when the promise
   * resolves to anything except `false`. Throwing or returning `false`
   * either suppresses confirmation (if no `failLabel` is provided) or
   * triggers the failed state.
   */
  onAction: () => void | boolean | Promise<void | boolean>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
  /** How long the confirm / fail overlay stays visible. */
  dwellMs?: number;
  /** Optional aria-label override (defaults to the label as text). */
  ariaLabel?: string;
};

/**
 * Outline button that briefly swaps its label for a check + confirmation
 * text after a successful action — same UX as the legacy
 * `InviteShareButton` "Copied!" feedback, lifted into a shared component
 * so every action button in the app behaves identically.
 *
 * Optionally also surfaces a failed state when the action returns `false`
 * or throws — opt in by passing `failLabel`.
 *
 * Status is owned by this component; the caller just awaits the action.
 */
export const ConfirmableButton = ({
  icon,
  label,
  confirmIcon = <FaCircleCheck />,
  confirmLabel,
  failIcon = <FaCircleXmark />,
  failLabel,
  onAction,
  variant = "outline",
  size = "md",
  disabled,
  className,
  dwellMs = DEFAULT_DWELL_MS,
  ariaLabel,
}: Props) => {
  const [status, setStatus] = useState<Status>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state on unmount so a pending timer can't fire on a dead component.
  useEffect(
    () => () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const handleClick = async () => {
    if (disabled) return;
    let success = true;
    try {
      const result = await onAction();
      if (result === false) success = false;
    } catch {
      success = false;
    }

    let nextStatus: Status;
    if (success) {
      nextStatus = "confirmed";
    } else if (failLabel) {
      nextStatus = "failed";
    } else {
      // Silent failure — keep original behavior when no fail UI is wired up.
      return;
    }

    setStatus(nextStatus);
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setStatus("idle");
      timeoutRef.current = null;
    }, dwellMs);
  };

  const showingOverlay = status !== "idle";

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(className, {
        [styles.confirmed]: status === "confirmed",
        [styles.failed]: status === "failed",
      })}
    >
      <span className={styles.label}>
        <span
          className={cn(styles.inner, { [styles.innerHidden]: showingOverlay })}
        >
          {icon}
          {label}
        </span>
        {status === "confirmed" && (
          <span className={styles.overlay}>
            {confirmIcon}
            {confirmLabel}
          </span>
        )}
        {status === "failed" && (
          <span className={styles.overlay}>
            {failIcon}
            {failLabel}
          </span>
        )}
      </span>
    </Button>
  );
};
