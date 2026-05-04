import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import cn from "classnames";

import styles from "./Popover.module.scss";

export type PopoverPlacement =
  | "bottom-start"
  | "bottom-end"
  | "bottom"
  | "top-start"
  | "top-end"
  | "top";

interface PopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  placement?: PopoverPlacement;
  offset?: number;
  minWidth?: number;
  flip?: boolean;
  className?: string;
  children: ReactNode;
}

interface Position {
  top: number;
  left: number;
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
  className,
  children,
}: PopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  const computePosition = useCallback((): Position | null => {
    const anchor = anchorRef.current;
    if (!anchor) return null;
    const rect = anchor.getBoundingClientRect();
    const popoverEl = popoverRef.current;
    const popoverWidth = popoverEl?.offsetWidth ?? minWidth;
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
      Math.min(left, window.innerWidth - popoverWidth - VIEWPORT_MARGIN)
    );
    return { top, left: clampedLeft };
  }, [anchorRef, placement, offset, minWidth, flip]);

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
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, computePosition]);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (!(e.target instanceof Node)) return;
      if (anchorRef.current?.contains(e.target)) return;
      if (popoverRef.current?.contains(e.target)) return;
      onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      className={cn(styles.popover, className)}
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        minWidth,
        visibility: position ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body
  );
};
