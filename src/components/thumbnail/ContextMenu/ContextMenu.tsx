import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  useDismissOnEscape,
  useDismissOnOutsideClick,
} from "@/hooks/useDismiss";

import styles from "./ContextMenu.module.scss";

export type ContextMenuItem =
  | {
      type: "action";
      label: string;
      icon?: React.ReactNode;
      shortcut?: string;
      onClick: () => void;
      disabled?: boolean;
      danger?: boolean;
    }
  | { type: "separator" };

type Props = {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
};

export const ContextMenu = ({ x, y, items, onClose }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    let nx = x;
    let ny = y;
    if (nx + rect.width > window.innerWidth - 8) {
      nx = Math.max(8, window.innerWidth - rect.width - 8);
    }
    if (ny + rect.height > window.innerHeight - 8) {
      ny = Math.max(8, window.innerHeight - rect.height - 8);
    }
    setPos({ x: nx, y: ny });
  }, [x, y]);

  useDismissOnOutsideClick({
    enabled: true,
    refs: [ref],
    onDismiss: onClose,
  });
  useDismissOnEscape({ enabled: true, onDismiss: onClose });

  useEffect(() => {
    const onScroll = () => onClose();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className={styles.menu}
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item.type === "separator" ? (
          <div key={`sep-${i}`} className={styles.separator} />
        ) : (
          <button
            key={`item-${i}`}
            className={[
              styles.item,
              item.disabled ? styles.disabled : "",
              item.danger ? styles.danger : "",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              item.onClick();
              onClose();
            }}
            type="button"
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
            {item.shortcut ? (
              <span className={styles.shortcut}>{item.shortcut}</span>
            ) : null}
          </button>
        )
      )}
    </div>,
    document.body
  );
};
