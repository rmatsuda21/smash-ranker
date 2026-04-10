import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaAlignCenter,
  FaAlignLeft,
  FaAlignRight,
  FaGear,
  FaImage,
  FaTableCellsLarge,
  FaTableList,
  FaWandMagicSparkles,
} from "react-icons/fa6";

import cn from "classnames";

import {
  DropDownSelect,
  DropDownItem,
} from "@/components/top8/DropDownSelect/DropDownSelect";
import { useTierListStore } from "@/store/tierListStore";

import styles from "./TierListSettings.module.scss";

const FONT_FAMILY_OPTIONS: DropDownItem<string>[] = [
  { id: "inherit", value: "inherit", display: "Default" },
  { id: "arial", value: "Arial, sans-serif", display: "Arial" },
  { id: "impact", value: "Impact, sans-serif", display: "Impact" },
  { id: "georgia", value: "Georgia, serif", display: "Georgia" },
  { id: "courier", value: "'Courier New', monospace", display: "Courier" },
  { id: "comic-sans", value: "'Comic Sans MS', cursive", display: "Comic Sans" },
  { id: "times", value: "'Times New Roman', serif", display: "Times" },
  { id: "trebuchet", value: "'Trebuchet MS', sans-serif", display: "Trebuchet" },
  { id: "verdana", value: "Verdana, sans-serif", display: "Verdana" },
];

const FONT_WEIGHT_OPTIONS: DropDownItem<number>[] = [
  { id: "400", value: 400, display: "Normal" },
  { id: "600", value: 600, display: "Semi-Bold" },
  { id: "700", value: 700, display: "Bold" },
  { id: "800", value: 800, display: "Extra Bold" },
  { id: "900", value: 900, display: "Black" },
];

export const TierListSettings = () => {
  const dispatch = useTierListStore((s) => s.dispatch);
  const layout = useTierListStore((s) => s.layout);
  const imageMode = useTierListStore((s) => s.imageMode);
  const labelFont = useTierListStore((s) => s.labelFont);
  const titleAlign = useTierListStore((s) => s.titleAlign);

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target instanceof Node)) return;
      if (
        !wrapperRef.current?.contains(e.target) &&
        !popoverRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const popoverWidth = 220;
      const left = Math.min(rect.left, window.innerWidth - popoverWidth - 8);
      setPosition({ top: rect.bottom + 4, left: Math.max(8, left) });
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div ref={wrapperRef} className={styles.settingsButton} onClick={handleToggle}>
        <FaGear size={14} /> Settings
      </div>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.popover}
            style={{ top: position.top, left: position.left }}
          >
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Layout</div>
              <div className={styles.optionGroup}>
                <button
                  className={cn(styles.optionButton, layout === "side" && styles.active)}
                  onClick={() => dispatch({ type: "SET_LAYOUT", layout: "side" })}
                >
                  <FaTableList size={14} /> Side
                </button>
                <button
                  className={cn(styles.optionButton, layout === "top" && styles.active)}
                  onClick={() => dispatch({ type: "SET_LAYOUT", layout: "top" })}
                >
                  <FaTableCellsLarge size={14} /> Top
                </button>
                <button
                  className={cn(styles.optionButton, layout === "fancy" && styles.active)}
                  onClick={() => dispatch({ type: "SET_LAYOUT", layout: "fancy" })}
                >
                  <FaWandMagicSparkles size={14} /> Fancy
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionLabel}>Image Style</div>
              <div className={styles.optionGroup}>
                <button
                  className={cn(styles.optionButton, imageMode === "stock" && styles.active)}
                  onClick={() => dispatch({ type: "SET_IMAGE_MODE", mode: "stock" })}
                >
                  <FaImage size={14} /> Stock
                </button>
                <button
                  className={cn(styles.optionButton, imageMode === "main" && styles.active)}
                  onClick={() => dispatch({ type: "SET_IMAGE_MODE", mode: "main" })}
                >
                  <FaImage size={14} /> Main Art
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionLabel}>Title Alignment</div>
              <div className={styles.optionGroup}>
                <button
                  className={cn(styles.optionButton, titleAlign === "left" && styles.active)}
                  onClick={() => dispatch({ type: "SET_TITLE_ALIGN", align: "left" })}
                >
                  <FaAlignLeft size={14} /> Left
                </button>
                <button
                  className={cn(styles.optionButton, titleAlign === "center" && styles.active)}
                  onClick={() => dispatch({ type: "SET_TITLE_ALIGN", align: "center" })}
                >
                  <FaAlignCenter size={14} /> Center
                </button>
                <button
                  className={cn(styles.optionButton, titleAlign === "right" && styles.active)}
                  onClick={() => dispatch({ type: "SET_TITLE_ALIGN", align: "right" })}
                >
                  <FaAlignRight size={14} /> Right
                </button>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <div className={styles.sectionLabel}>Label Font</div>
              <DropDownSelect
                options={FONT_FAMILY_OPTIONS}
                selectedValue={labelFont.family}
                onChange={(value) =>
                  dispatch({ type: "SET_LABEL_FONT", font: { family: value } })
                }
                className={styles.dropdown}
              />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionLabel}>Font Weight</div>
              <DropDownSelect
                options={FONT_WEIGHT_OPTIONS}
                selectedValue={labelFont.weight}
                onChange={(value) =>
                  dispatch({ type: "SET_LABEL_FONT", font: { weight: value } })
                }
                className={styles.dropdown}
              />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionLabel}>Font Size</div>
              <div className={styles.sizeRow}>
                <input
                  type="range"
                  className={styles.rangeInput}
                  min={12}
                  max={48}
                  value={labelFont.size}
                  onChange={(e) =>
                    dispatch({ type: "SET_LABEL_FONT", font: { size: Number(e.target.value) } })
                  }
                />
                <span className={styles.sizeValue}>{labelFont.size}px</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
