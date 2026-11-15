import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import cn from "classnames";

import { usePortalContainer } from "@/hooks/usePortalContainer";
import { SUPPORTS_POPOVER } from "@/hooks/useTopLayer";

import styles from "@/components/shared/Tooltip/Tooltip.module.scss";

const SHOW_DELAY_MS = 200;
// Long enough to cross the gap between trigger and tooltip without it closing.
const HIDE_GRACE_MS = 100;
const GAP = 4;
const VIEWPORT_MARGIN = 8;

type Options = {
  /** Tooltip text. Falsy disables the tooltip entirely. */
  content: string | null | undefined;
  delay?: number;
  /**
   * Link the tooltip to the trigger with `aria-describedby`. Turn off when
   * the same text is already the trigger's accessible name (e.g. it is also
   * the `aria-label` of an icon button), so it isn't announced twice.
   */
  describe?: boolean;
  className?: string;
};

type Position = { top: number; left: number };

/**
 * Tooltip that opens on mouse hover and on keyboard focus, closes on Escape,
 * and stays open while the pointer is over it (WCAG 1.4.13).
 *
 * Spread `triggerProps` on the element the tooltip belongs to and render
 * `tooltip` anywhere in the same component.
 */
export const useTooltip = ({
  content,
  delay = SHOW_DELAY_MS,
  describe = true,
  className,
}: Options) => {
  const id = useId();
  const [shown, setShown] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const portalContainer = usePortalContainer();

  const enabled = Boolean(content);

  const clearTimer = useCallback(() => clearTimeout(timerRef.current), []);

  const show = useCallback(
    (trigger: HTMLElement, wait: number) => {
      clearTimer();
      triggerRef.current = trigger;
      timerRef.current = setTimeout(() => setShown(true), wait);
    },
    [clearTimer],
  );

  const hide = useCallback(
    (wait = 0) => {
      clearTimer();
      if (wait > 0) {
        timerRef.current = setTimeout(() => setShown(false), wait);
      } else {
        setShown(false);
      }
    },
    [clearTimer],
  );

  useEffect(() => clearTimer, [clearTimer]);

  const isVisible = shown && enabled;

  // Promote to the top layer and place above the trigger, flipping below
  // when there is no room.
  useLayoutEffect(() => {
    const tip = tooltipRef.current;
    const trigger = triggerRef.current;
    if (!isVisible || !tip || !trigger) {
      setPosition(null);
      return;
    }

    if (SUPPORTS_POPOVER && !tip.matches(":popover-open")) tip.showPopover();

    const anchor = trigger.getBoundingClientRect();
    const size = tip.getBoundingClientRect();
    const above = anchor.top - size.height - GAP;
    const centered = anchor.left + anchor.width / 2 - size.width / 2;
    setPosition({
      top: above >= VIEWPORT_MARGIN ? above : anchor.bottom + GAP,
      left: Math.max(
        VIEWPORT_MARGIN,
        Math.min(centered, window.innerWidth - size.width - VIEWPORT_MARGIN),
      ),
    });

    return () => {
      if (SUPPORTS_POPOVER && tip.isConnected && tip.matches(":popover-open")) {
        tip.hidePopover();
      }
    };
  }, [isVisible, content]);

  useEffect(() => {
    if (!isVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    const onScroll = () => hide();
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [isVisible, hide]);

  // A closed popover is still a valid `aria-describedby` target, so in
  // describe mode the element stays mounted (the browser keeps it hidden).
  const mounted = enabled && (isVisible || (describe && SUPPORTS_POPOVER));

  const triggerProps: React.HTMLAttributes<HTMLElement> = enabled
    ? {
        onPointerEnter: (e) => {
          // Touch has no hover; a tap would leave the tooltip stuck open.
          if (e.pointerType === "touch") return;
          show(e.currentTarget, delay);
        },
        onPointerLeave: (e) => {
          if (e.currentTarget.matches(":focus-visible")) return;
          hide(HIDE_GRACE_MS);
        },
        onPointerDown: () => hide(),
        onFocus: (e) => {
          // Keyboard focus only: a mouse click also focuses the trigger and
          // would otherwise pin the tooltip open after the pointer leaves.
          if (e.target.matches(":focus-visible")) show(e.currentTarget, 0);
        },
        onBlur: () => hide(),
        "aria-describedby": describe && mounted ? id : undefined,
      }
    : {};

  const tooltip = mounted
    ? createPortal(
        <div
          ref={tooltipRef}
          id={id}
          role="tooltip"
          popover="manual"
          className={cn(styles.tooltip, className)}
          style={{
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            visibility: position ? "visible" : "hidden",
          }}
          onPointerEnter={clearTimer}
          onPointerLeave={() => hide()}
          // Portalled, but still a React child of wherever it is rendered:
          // keep clicks on the tooltip from reaching the trigger's handlers.
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {content}
        </div>,
        portalContainer,
      )
    : null;

  return { triggerProps, tooltip };
};
