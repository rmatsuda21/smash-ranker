import {
  type ReactNode,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import cn from "classnames";

import {
  useDismissOnEscape,
  useDismissOnOutsideClick,
} from "@/hooks/useDismiss";
import { SUPPORTS_POPOVER } from "@/hooks/useTopLayer";
import { usePortalContainer } from "@/hooks/usePortalContainer";

import styles from "./Popover.module.scss";

export type PopoverPlacement =
  "bottom-start" | "bottom-end" | "bottom" | "top-start" | "top-end" | "top";

interface PopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  placement?: PopoverPlacement;
  offset?: number;
  minWidth?: number;
  flip?: boolean;
  matchAnchorWidth?: boolean;
  className?: string;
  /** ARIA role of the panel. Pass `null` when the content brings its own. */
  role?: React.AriaRole | null;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  children: ReactNode;
}

interface Position {
  top: number;
  left: number;
  width?: number;
}

const VIEWPORT_MARGIN = 8;

export const Popover = ({
  anchorRef,
  open,
  onClose,
  placement = "bottom-start",
  offset = 4,
  minWidth = 220,
  flip = true,
  matchAnchorWidth = false,
  className,
  role = "dialog",
  onKeyDown,
  children,
}: PopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const portalContainer = usePortalContainer();
  const [position, setPosition] = useState<Position | null>(null);

  const computePosition = useCallback((): Position | null => {
    const anchor = anchorRef.current;
    if (!anchor) return null;
    const rect = anchor.getBoundingClientRect();
    const popoverEl = popoverRef.current;
    const popoverWidth = matchAnchorWidth
      ? rect.width
      : (popoverEl?.offsetWidth ?? minWidth);
    const popoverHeight = popoverEl?.offsetHeight ?? 0;

    const wantsTop = placement.startsWith("top");
    let isTop = wantsTop;
    if (flip && popoverHeight > 0) {
      const bottomSpace = window.innerHeight - rect.bottom - offset;
      const topSpace = rect.top - offset;
      if (!wantsTop && bottomSpace < popoverHeight && topSpace > bottomSpace) {
        isTop = true;
      } else if (
        wantsTop &&
        topSpace < popoverHeight &&
        bottomSpace > topSpace
      ) {
        isTop = false;
      }
    }

    const top = isTop
      ? rect.top - offset - popoverHeight
      : rect.bottom + offset;

    let left: number;
    if (placement === "bottom-end" || placement === "top-end") {
      left = rect.right - popoverWidth;
    } else if (placement === "bottom" || placement === "top") {
      left = rect.left + rect.width / 2 - popoverWidth / 2;
    } else {
      left = rect.left;
    }
    const clampedLeft = Math.max(
      VIEWPORT_MARGIN,
      Math.min(left, window.innerWidth - popoverWidth - VIEWPORT_MARGIN),
    );
    return {
      top,
      left: clampedLeft,
      width: matchAnchorWidth ? rect.width : undefined,
    };
  }, [anchorRef, placement, offset, minWidth, flip, matchAnchorWidth]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const update = () => {
      const next = computePosition();
      if (next) setPosition(next);
    };

    update();
    // Re-measure once the popover has actually mounted so position reflects
    // real dimensions, not the minWidth estimate. Without this, smart-flip
    // can't fire on first open and content-driven width is mispositioned.
    const rafId = requestAnimationFrame(update);
    // Content can change size after opening (async data, expandable
    // sections); re-place so flip and top-anchored positions stay correct.
    const el = popoverRef.current;
    const resizeObserver =
      el && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;
    if (el) resizeObserver?.observe(el);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, computePosition]);

  // Native path: `popover="auto"` puts the element in the top layer and
  // gives us outside-click and Esc dismissal for free.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    const el = popoverRef.current;
    if (!open || !el || !SUPPORTS_POPOVER) return;
    el.showPopover();

    // Light dismiss fires on the release of a press on the trigger, and the
    // trigger's own click handler runs right after. Left alone, that click
    // would toggle the popover straight back open, so swallow it.
    let pressedOnAnchor = false;
    const onPointerDown = (e: PointerEvent) => {
      pressedOnAnchor =
        e.target instanceof Node && !!anchorRef.current?.contains(e.target);
    };
    const onPointerUp = () => {
      setTimeout(() => {
        pressedOnAnchor = false;
      }, 0);
    };
    const onBeforeToggle = (e: Event) => {
      if ((e as ToggleEvent).newState !== "closed") return;
      const anchor = anchorRef.current;
      if (pressedOnAnchor && anchor) {
        const swallow = (click: Event) => {
          click.stopPropagation();
          click.preventDefault();
        };
        const options = { capture: true, once: true };
        anchor.addEventListener("click", swallow, options);
        setTimeout(
          () => anchor.removeEventListener("click", swallow, options),
          500,
        );
      }
      onCloseRef.current();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    el.addEventListener("beforetoggle", onBeforeToggle);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      el.removeEventListener("beforetoggle", onBeforeToggle);
      if (el.isConnected && el.matches(":popover-open")) el.hidePopover();
    };
  }, [open, anchorRef]);

  // Fallback path for browsers without the Popover API.
  useDismissOnOutsideClick({
    enabled: open && !SUPPORTS_POPOVER,
    refs: [anchorRef, popoverRef],
    onDismiss: onClose,
  });
  useDismissOnEscape({
    enabled: open && !SUPPORTS_POPOVER,
    onDismiss: onClose,
  });

  if (!open) return null;

  const node = (
    <div
      ref={popoverRef}
      popover="auto"
      role={role ?? undefined}
      onKeyDown={onKeyDown}
      className={cn(styles.popover, className)}
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        minWidth: position?.width ?? minWidth,
        width: position?.width,
        visibility: position ? "visible" : "hidden",
      }}
    >
      {children}
    </div>
  );

  // Rendered in place: the top layer escapes clipping and stacking on its
  // own, and DOM nesting is what keeps a popover inside a modal interactive
  // and a popover inside a popover from dismissing its parent. Only the
  // fallback still needs a portal.
  return SUPPORTS_POPOVER ? node : createPortal(node, portalContainer);
};
