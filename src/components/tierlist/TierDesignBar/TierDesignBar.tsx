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
import { GameSwitch } from "@/components/shared/GameSwitch/GameSwitch";
import { Slider } from "@/components/shared/Slider/Slider";
import { Popover } from "@/components/shared/Popover/Popover";
import { FieldGroup } from "@/components/top8/EditorForm/EditorForm";
import { TextFontSelect } from "@/components/thumbnail/Pickers/TextFontSelect";
import { useFontStore } from "@/store/fontStore";
import { pickClosestWeight } from "@/utils/fonts/weightFallback";
import {
  isLegacyFontStack,
  labelFontDisplayName,
  labelFontFamilyCss,
} from "@/utils/tierlist/labelFont";
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

const WEIGHT_LABELS: Record<number, MessageDescriptor> = {
  100: msg`Thin`,
  200: msg`Extra Light`,
  300: msg`Light`,
  400: msg`Normal`,
  500: msg`Medium`,
  600: msg`Semi-Bold`,
  700: msg`Bold`,
  800: msg`Extra Bold`,
  900: msg`Black`,
};

// What a system font stack from an older list can be asked for.
const LEGACY_WEIGHTS = [400, 600, 700, 800, 900];

type Props = {
  className?: string;
};

type OpenMenu = "palette" | "font" | null;

// One strip above the list with every look option a click away: the three
// small choices inline, palette and font behind a popover each.
export const TierDesignBar = ({ className }: Props) => {
  const { _ } = useLingui();
  const dispatch = useTierListStore((s) => s.dispatch);
  const game = useTierListStore((s) => s.game);
  const layout = useTierListStore((s) => s.layout);
  const imageMode = useTierListStore((s) => s.imageMode);
  const labelFont = useTierListStore((s) => s.labelFont);
  const titleAlign = useTierListStore((s) => s.titleAlign);
  const tiers = useTierListStore((s) => s.tiers);
  const activePaletteId = useTierListStore((s) => s.activePaletteId);

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const paletteRef = useRef<HTMLButtonElement>(null);
  const fontRef = useRef<HTMLButtonElement>(null);

  // The weights the chosen font actually ships, so every option in the
  // weight list looks different from the others.
  const fontWeights = useFontStore(
    (state) =>
      Array.from(state.fonts).find((f) => f.fontFamily === labelFont.family)
        ?.weights,
  );
  const weights = isLegacyFontStack(labelFont.family)
    ? LEGACY_WEIGHTS
    : (fontWeights ?? [labelFont.weight]);
  const selectedWeight = pickClosestWeight(labelFont.weight, weights);
  const fontWeightOptions: DropDownItem<number>[] = weights.map((weight) => ({
    id: String(weight),
    value: weight,
    display: WEIGHT_LABELS[weight] ? _(WEIGHT_LABELS[weight]) : String(weight),
  }));

  const handleFontChange = (family: string) => {
    const shipped = Array.from(useFontStore.getState().fonts).find(
      (f) => f.fontFamily === family,
    )?.weights;
    dispatch({
      type: "SET_LABEL_FONT",
      font: {
        family,
        weight: shipped
          ? pickClosestWeight(labelFont.weight, shipped)
          : labelFont.weight,
      },
    });
  };

  const activePalette =
    TIER_PALETTES.find((p) => p.id === activePaletteId) ??
    TIER_PALETTES.find((p) => p.id === DEFAULT_PALETTE_ID)!;
  const fontName = labelFontDisplayName(labelFont.family);

  const toggle = (menu: Exclude<OpenMenu, null>) =>
    setOpenMenu((current) => (current === menu ? null : menu));

  return (
    <div className={cn(styles.bar, className)}>
      <div className={styles.group}>
        <span className={styles.label}>
          <Trans>Game</Trans>
        </span>
        <GameSwitch
          value={game}
          onChange={(value) => dispatch({ type: "SET_GAME", game: value })}
        />
      </div>

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
            style={{ fontFamily: labelFontFamilyCss(labelFont.family) }}
          >
            {fontName}
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
          <TextFontSelect
            value={labelFont.family}
            onChange={handleFontChange}
            weights={[labelFont.weight]}
            placeholder={fontName}
            className={styles.dropdown}
          />
        </FieldGroup>
        <FieldGroup label={<Trans>Font Weight</Trans>}>
          <DropDownSelect
            options={fontWeightOptions}
            selectedValue={selectedWeight}
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
