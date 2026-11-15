import { useRef, useState } from "react";
import {
  FaAlignCenter,
  FaAlignLeft,
  FaAlignRight,
  FaChevronDown,
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
} from "@/components/shared/DropDownSelect/DropDownSelect";
import { RadioGroup } from "@/components/shared/RadioGroup/RadioGroup";
import { Slider } from "@/components/shared/Slider/Slider";
import { Popover } from "@/components/shared/Popover/Popover";
import { FieldGroup } from "@/components/top8/EditorForm/EditorForm";
import { useTierListStore } from "@/store/tierListStore";
import {
  TIER_PALETTES,
  getColorsForTierCount,
  DEFAULT_PALETTE_ID,
} from "@/consts/tierlist/tierPalettes";

import {
  ImageDisplayMode,
  TierListLayout,
  TitleAlign,
} from "@/types/tierlist/TierList";

import styles from "./TierDesignBar.module.scss";

const FONT_FAMILY_SOURCE: {
  id: string;
  value: string;
  label: MessageDescriptor;
}[] = [
  { id: "inherit", value: "inherit", label: msg`Default` },
  { id: "arial", value: "Arial, sans-serif", label: msg`Arial` },
  { id: "impact", value: "Impact, sans-serif", label: msg`Impact` },
  { id: "georgia", value: "Georgia, serif", label: msg`Georgia` },
  { id: "courier", value: "'Courier New', monospace", label: msg`Courier` },
  {
    id: "comic-sans",
    value: "'Comic Sans MS', cursive",
    label: msg`Comic Sans`,
  },
  { id: "times", value: "'Times New Roman', serif", label: msg`Times` },
  {
    id: "trebuchet",
    value: "'Trebuchet MS', sans-serif",
    label: msg`Trebuchet`,
  },
  { id: "verdana", value: "Verdana, sans-serif", label: msg`Verdana` },
];

const FONT_WEIGHT_SOURCE: {
  id: string;
  value: number;
  label: MessageDescriptor;
}[] = [
  { id: "400", value: 400, label: msg`Normal` },
  { id: "600", value: 600, label: msg`Semi-Bold` },
  { id: "700", value: 700, label: msg`Bold` },
  { id: "800", value: 800, label: msg`Extra Bold` },
  { id: "900", value: 900, label: msg`Black` },
];

type Props = {
  className?: string;
};

type OpenMenu = "palette" | "font" | null;

// One strip above the list with every look option a click away: the three
// small choices inline, palette and font behind a popover each.
export const TierDesignBar = ({ className }: Props) => {
  const { _ } = useLingui();
  const dispatch = useTierListStore((s) => s.dispatch);
  const layout = useTierListStore((s) => s.layout);
  const imageMode = useTierListStore((s) => s.imageMode);
  const labelFont = useTierListStore((s) => s.labelFont);
  const titleAlign = useTierListStore((s) => s.titleAlign);
  const tiers = useTierListStore((s) => s.tiers);
  const activePaletteId = useTierListStore((s) => s.activePaletteId);

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const paletteRef = useRef<HTMLButtonElement>(null);
  const fontRef = useRef<HTMLButtonElement>(null);

  const fontFamilyOptions: DropDownItem<string>[] = FONT_FAMILY_SOURCE.map(
    ({ id, value, label }) => ({ id, value, display: _(label) }),
  );
  const fontWeightOptions: DropDownItem<number>[] = FONT_WEIGHT_SOURCE.map(
    ({ id, value, label }) => ({ id, value, display: _(label) }),
  );

  const activePalette =
    TIER_PALETTES.find((p) => p.id === activePaletteId) ??
    TIER_PALETTES.find((p) => p.id === DEFAULT_PALETTE_ID)!;
  const activeFont =
    FONT_FAMILY_SOURCE.find((f) => f.value === labelFont.family) ??
    FONT_FAMILY_SOURCE[0];

  const toggle = (menu: Exclude<OpenMenu, null>) =>
    setOpenMenu((current) => (current === menu ? null : menu));

  return (
    <div className={cn(styles.bar, className)}>
      <div className={styles.group}>
        <span className={styles.label}>
          <Trans>Layout</Trans>
        </span>
        <RadioGroup<TierListLayout>
          value={layout}
          onChange={(value) => dispatch({ type: "SET_LAYOUT", layout: value })}
          options={[
            {
              value: "side",
              label: (
                <>
                  <FaTableList aria-hidden="true" /> <Trans>Side</Trans>
                </>
              ),
            },
            {
              value: "top",
              label: (
                <>
                  <FaTableCellsLarge aria-hidden="true" /> <Trans>Top</Trans>
                </>
              ),
            },
            {
              value: "fancy",
              label: (
                <>
                  <FaWandMagicSparkles aria-hidden="true" />{" "}
                  <Trans>Fancy</Trans>
                </>
              ),
            },
          ]}
        />
      </div>

      <div className={styles.group}>
        <span className={styles.label}>
          <Trans>Image Style</Trans>
        </span>
        <RadioGroup<ImageDisplayMode>
          value={imageMode}
          onChange={(value) =>
            dispatch({ type: "SET_IMAGE_MODE", mode: value })
          }
          options={[
            { value: "stock", label: <Trans>Stock</Trans> },
            { value: "main", label: <Trans>Main Art</Trans> },
          ]}
        />
      </div>

      <div className={styles.group}>
        <span className={styles.label}>
          <Trans>Title Alignment</Trans>
        </span>
        <RadioGroup<TitleAlign>
          value={titleAlign}
          onChange={(value) =>
            dispatch({ type: "SET_TITLE_ALIGN", align: value })
          }
          options={[
            {
              value: "left",
              label: (
                <>
                  <FaAlignLeft aria-hidden="true" />
                  <span className={styles.srOnly}>
                    <Trans>Left</Trans>
                  </span>
                </>
              ),
            },
            {
              value: "center",
              label: (
                <>
                  <FaAlignCenter aria-hidden="true" />
                  <span className={styles.srOnly}>
                    <Trans>Center</Trans>
                  </span>
                </>
              ),
            },
            {
              value: "right",
              label: (
                <>
                  <FaAlignRight aria-hidden="true" />
                  <span className={styles.srOnly}>
                    <Trans>Right</Trans>
                  </span>
                </>
              ),
            },
          ]}
        />
      </div>

      <div className={styles.group}>
        <span className={styles.label}>
          <Trans>Color Palette</Trans>
        </span>
        <button
          ref={paletteRef}
          type="button"
          className={styles.trigger}
          aria-haspopup="dialog"
          aria-expanded={openMenu === "palette"}
          onClick={() => toggle("palette")}
        >
          <span className={styles.paletteSwatches}>
            {activePalette.colors.slice(0, 6).map((color, i) => (
              <span
                key={i}
                className={styles.paletteSwatch}
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
          <span className={styles.srOnly}>{_(activePalette.name)}</span>
          <FaChevronDown className={styles.caret} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>
          <Trans>Label Font</Trans>
        </span>
        <button
          ref={fontRef}
          type="button"
          className={styles.trigger}
          aria-haspopup="dialog"
          aria-expanded={openMenu === "font"}
          onClick={() => toggle("font")}
        >
          <span
            className={styles.fontName}
            style={{ fontFamily: labelFont.family }}
          >
            {_(activeFont.label)}
          </span>
          <span className={styles.fontSize}>{labelFont.size}</span>
          <FaChevronDown className={styles.caret} aria-hidden="true" />
        </button>
      </div>

      <Popover
        anchorRef={paletteRef}
        open={openMenu === "palette"}
        onClose={() => setOpenMenu(null)}
        placement="bottom-start"
        offset={4}
        minWidth={240}
        className={styles.popover}
      >
        {TIER_PALETTES.map((palette) => (
          <button
            key={palette.id}
            type="button"
            aria-pressed={activePaletteId === palette.id}
            className={cn(
              styles.paletteOption,
              activePaletteId === palette.id && styles.active,
            )}
            onClick={() => {
              const colors = getColorsForTierCount(palette, tiers.length);
              dispatch({
                type: "APPLY_PALETTE",
                paletteId: palette.id,
                colors,
              });
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
      </Popover>

      <Popover
        anchorRef={fontRef}
        open={openMenu === "font"}
        onClose={() => setOpenMenu(null)}
        placement="bottom-end"
        offset={4}
        minWidth={260}
        className={cn(styles.popover, styles.fontPopover)}
      >
        <FieldGroup label={<Trans>Font Family</Trans>}>
          <DropDownSelect
            options={fontFamilyOptions}
            selectedValue={labelFont.family}
            onChange={(value) =>
              dispatch({ type: "SET_LABEL_FONT", font: { family: value } })
            }
            className={styles.dropdown}
          />
        </FieldGroup>
        <FieldGroup label={<Trans>Font Weight</Trans>}>
          <DropDownSelect
            options={fontWeightOptions}
            selectedValue={labelFont.weight}
            onChange={(value) =>
              dispatch({ type: "SET_LABEL_FONT", font: { weight: value } })
            }
            className={styles.dropdown}
          />
        </FieldGroup>
        <div className={styles.size}>
          <Slider
            label={
              <span className={styles.sliderLabel}>
                <Trans>Font Size</Trans>
                <span className={styles.sliderValue}>{labelFont.size}px</span>
              </span>
            }
            min={12}
            max={48}
            value={labelFont.size}
            onValueChange={(value) =>
              dispatch({ type: "SET_LABEL_FONT", font: { size: value } })
            }
          />
        </div>
      </Popover>
    </div>
  );
};
