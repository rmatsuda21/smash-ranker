import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaArrowDown,
  FaArrowUp,
  FaGear,
  FaPalette,
  FaTrash,
} from "react-icons/fa6";

import { ColorInput } from "@/components/shared/ColorInput/ColorInput";
import { useTierListStore } from "@/store/tierListStore";

import styles from "./TierSettings.module.scss";

type Props = {
  tierId: string;
  tierIndex: number;
  tierCount: number;
  color: string;
};

export const TierSettings = ({ tierId, tierIndex, tierCount, color }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dispatch = useTierListStore((s) => s.dispatch);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target instanceof Node)) return;
      if (
        !buttonRef.current?.contains(e.target) &&
        !popoverRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 168;
      const popoverHeight = 180; // approximate popover height
      const left = Math.min(rect.left, window.innerWidth - popoverWidth - 8);

      const fitsBelow = rect.bottom + 4 + popoverHeight <= window.innerHeight;
      const top = fitsBelow ? rect.bottom + 4 : rect.top - popoverHeight - 4;

      setPosition({ top: Math.max(8, top), left: Math.max(8, left) });
    }
    setIsOpen(!isOpen);
  };

  const handleDelete = () => {
    dispatch({ type: "REMOVE_TIER", tierId });
    setIsOpen(false);
  };

  const handleMoveUp = () => {
    dispatch({ type: "MOVE_TIER", fromIndex: tierIndex, toIndex: tierIndex - 1 });
  };

  const handleMoveDown = () => {
    dispatch({ type: "MOVE_TIER", fromIndex: tierIndex, toIndex: tierIndex + 1 });
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={styles.gearButton}
        onClick={handleToggle}
        aria-label="Tier settings"
      >
        <FaGear size={14} />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.popover}
            style={{ top: position.top, left: position.left }}
          >
            <div className={styles.colorRow}>
                  <FaPalette size={12} />
                  <span>Color</span>
                  <ColorInput
                    color={color}
                    onChange={(c) =>
                      dispatch({ type: "RECOLOR_TIER", tierId, color: c })
                    }
                    className={styles.colorInput}
                  />
                </div>
                <button
                  className={styles.menuItem}
                  onClick={handleMoveUp}
                  disabled={tierIndex === 0}
                >
                  <FaArrowUp size={12} /> Move Up
                </button>
                <button
                  className={styles.menuItem}
                  onClick={handleMoveDown}
                  disabled={tierIndex === tierCount - 1}
                >
                  <FaArrowDown size={12} /> Move Down
                </button>
                <button
                  className={styles.menuItem}
                  onClick={handleDelete}
                  data-danger
                >
                  <FaTrash size={12} /> Delete
                </button>
          </div>,
          document.body
        )}
    </>
  );
};
