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
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { type MessageDescriptor } from "@lingui/core";
import { useLingui } from "@lingui/react";

import cn from "classnames";

import {
  DropDownSelect,
  DropDownItem,
} from "@/components/top8/DropDownSelect/DropDownSelect";
import { useTierListStore } from "@/store/tierListStore";
import { TIER_PALETTES, getColorsForTierCount } from "@/consts/tierlist/tierPalettes";

import styles from "./TierListSettings.module.scss";

const FONT_FAMILY_SOURCE: { id: string; value: string; label: MessageDescriptor }[] = [
  { id: "inherit", value: "inherit", label: msg`Default` },
  { id: "arial", value: "Arial, sans-serif", label: msg`Arial` },
  { id: "impact", value: "Impact, sans-serif", label: msg`Impact` },
  { id: "georgia", value: "Georgia, serif", label: msg`Georgia` },
  { id: "courier", value: "'Courier New', monospace", label: msg`Courier` },
  { id: "comic-sans", value: "'Comic Sans MS', cursive", label: msg`Comic Sans` },
  { id: "times", value: "'Times New Roman', serif", label: msg`Times` },
  { id: "trebuchet", value: "'Trebuchet MS', sans-serif", label: msg`Trebuchet` },
  { id: "verdana", value: "Verdana, sans-serif", label: msg`Verdana` },
];

const FONT_WEIGHT_SOURCE: { id: string; value: number; label: MessageDescriptor }[] = [
  { id: "400", value: 400, label: msg`Normal` },
  { id: "600", value: 600, label: msg`Semi-Bold` },
  { id: "700", value: 700, label: msg`Bold` },
  { id: "800", value: 800, label: msg`Extra Bold` },
  { id: "900", value: 900, label: msg`Black` },
];

export const TierListSettings = () => {
  const { _ } = useLingui();
  const dispatch = useTierListStore((s) => s.dispatch);
  const layout = useTierListStore((s) => s.layout);
  const imageMode = useTierListStore((s) => s.imageMode);
  const labelFont = useTierListStore((s) => s.labelFont);
  const titleAlign = useTierListStore((s) => s.titleAlign);
  const tiers = useTierListStore((s) => s.tiers);
  const activePaletteId = useTierListStore((s) => s.activePaletteId);

  const fontFamilyOptions: DropDownItem<string>[] = FONT_FAMILY_SOURCE.map(
    ({ id, value, label }) => ({ id, value, display: _(label) })
  );
  const fontWeightOptions: DropDownItem<number>[] = FONT_WEIGHT_SOURCE.map(
    ({ id, value, label }) => ({ id, value, display: _(label) })
  );

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [paletteScrolledToBottom, setPaletteScrolledToBottom] = useState(false);
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
        <FaGear size={14} /> <Trans>Settings</Trans>
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
              <div className={styles.sectionLabel}><Trans>Layout</Trans></div>
              <div className={styles.optionGroup}>
                <button
                  className={cn(styles.optionButton, layout === "side" && styles.active)}
                  onClick={() => dispatch({ type: "SET_LAYOUT", layout: "side" })}
                >
                  <FaTableList size={14} /> <Trans>Side</Trans>
                </button>
                <button
                  className={cn(styles.optionButton, layout === "top" && styles.active)}
                  onClick={() => dispatch({ type: "SET_LAYOUT", layout: "top" })}
                >
                  <FaTableCellsLarge size={14} /> <Trans>Top</Trans>
                </button>
                <button
                  className={cn(styles.optionButton, layout === "fancy" && styles.active)}
                  onClick={() => dispatch({ type: "SET_LAYOUT", layout: "fancy" })}
                >
                  <FaWandMagicSparkles size={14} /> <Trans>Fancy</Trans>
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionLabel}><Trans>Image Style</Trans></div>
              <div className={styles.optionGroup}>
                <button
                  className={cn(styles.optionButton, imageMode === "stock" && styles.active)}
                  onClick={() => dispatch({ type: "SET_IMAGE_MODE", mode: "stock" })}
                >
                  <FaImage size={14} /> <Trans>Stock</Trans>
                </button>
                <button
                  className={cn(styles.optionButton, imageMode === "main" && styles.active)}
                  onClick={() => dispatch({ type: "SET_IMAGE_MODE", mode: "main" })}
                >
                  <FaImage size={14} /> <Trans>Main Art</Trans>
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionLabel}><Trans>Title Alignment</Trans></div>
              <div className={styles.optionGroup}>
                <button
                  className={cn(styles.optionButton, titleAlign === "left" && styles.active)}
                  onClick={() => dispatch({ type: "SET_TITLE_ALIGN", align: "left" })}
                >
                  <FaAlignLeft size={14} /> <Trans>Left</Trans>
                </button>
                <button
                  className={cn(styles.optionButton, titleAlign === "center" && styles.active)}
                  onClick={() => dispatch({ type: "SET_TITLE_ALIGN", align: "center" })}
                >
                  <FaAlignCenter size={14} /> <Trans>Center</Trans>
                </button>
                <button
                  className={cn(styles.optionButton, titleAlign === "right" && styles.active)}
                  onClick={() => dispatch({ type: "SET_TITLE_ALIGN", align: "right" })}
                >
                  <FaAlignRight size={14} /> <Trans>Right</Trans>
                </button>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <div className={styles.sectionLabel}><Trans>Color Palette</Trans></div>
              <div className={cn(styles.paletteListWrapper, paletteScrolledToBottom && styles.scrolledToBottom)}>
              <div
                className={styles.paletteList}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  setPaletteScrolledToBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
                }}
              >
                {TIER_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    className={cn(styles.paletteOption, activePaletteId === palette.id && styles.active)}
                    onClick={() => {
                      const colors = getColorsForTierCount(palette, tiers.length);
                      dispatch({ type: "APPLY_PALETTE", paletteId: palette.id, colors });
                    }}
                  >
                    <span className={styles.paletteName}>{_(palette.name)}</span>
                    <span className={styles.paletteSwatches}>
                      {palette.colors.slice(0, 6).map((color, i) => (
                        <span
                          key={i}
                          className={styles.paletteSwatch}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <div className={styles.sectionLabel}><Trans>Label Font</Trans></div>
              <DropDownSelect
                options={fontFamilyOptions}
                selectedValue={labelFont.family}
                onChange={(value) =>
                  dispatch({ type: "SET_LABEL_FONT", font: { family: value } })
                }
                className={styles.dropdown}
              />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionLabel}><Trans>Font Weight</Trans></div>
              <DropDownSelect
                options={fontWeightOptions}
                selectedValue={labelFont.weight}
                onChange={(value) =>
                  dispatch({ type: "SET_LABEL_FONT", font: { weight: value } })
                }
                className={styles.dropdown}
              />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionLabel}><Trans>Font Size</Trans></div>
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
