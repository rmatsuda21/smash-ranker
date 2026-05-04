import {
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import cn from "classnames";

import styles from "./Popover.module.scss";

export type PopoverPlacement = "bottom-start" | "bottom-end" | "bottom";

interface PopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  placement?: PopoverPlacement;
  offset?: number;
  minWidth?: number;
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
  className,
  children,
}: PopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const computePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const popoverWidth = popoverRef.current?.offsetWidth ?? minWidth;
      const top = rect.bottom + offset;
      let left: number;
      switch (placement) {
        case "bottom-end":
          left = rect.right - popoverWidth;
          break;
        case "bottom":
          left = rect.left + rect.width / 2 - popoverWidth / 2;
          break;
        default:
          left = rect.left;
      }
      const clampedLeft = Math.max(
        VIEWPORT_MARGIN,
        Math.min(left, window.innerWidth - popoverWidth - VIEWPORT_MARGIN)
      );
      setPosition({ top, left: clampedLeft });
    };

    computePosition();
    window.addEventListener("resize", computePosition);
    window.addEventListener("scroll", computePosition, true);
    return () => {
      window.removeEventListener("resize", computePosition);
      window.removeEventListener("scroll", computePosition, true);
    };
  }, [open, anchorRef, placement, offset, minWidth]);

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
