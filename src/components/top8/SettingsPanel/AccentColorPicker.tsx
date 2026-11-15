import { useState, useEffect } from "react";
import { FaDroplet, FaCheck } from "react-icons/fa6";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { MessageDescriptor } from "@lingui/core";
import { useLingui } from "@lingui/react";

import { PREF_KEYS } from "@/consts/prefKeys";
import { getPref, setPref } from "@/utils/prefs";
import { useTooltip } from "@/hooks/useTooltip";
import { TooltipButton } from "@/components/shared/Tooltip/TooltipButton";
import { ColorInput } from "@/components/shared/ColorInput/ColorInput";

import styles from "./SettingsPanel.module.scss";

type AccentColor =
  "pink" | "crimson" | "amber" | "blue" | "green" | "purple" | "custom";

const ACCENT_COLORS: {
  value: Exclude<AccentColor, "custom">;
  label: MessageDescriptor;
  color: string;
}[] = [
  { value: "pink", label: msg`Pink`, color: "#e93d82" },
  { value: "crimson", label: msg`Red`, color: "#e5484d" },
  { value: "amber", label: msg`Amber`, color: "#f59e0b" },
  { value: "blue", label: msg`Blue`, color: "#3b82f6" },
  { value: "green", label: msg`Green`, color: "#10b981" },
  { value: "purple", label: msg`Purple`, color: "#8b5cf6" },
];

export const AccentColorPicker = () => {
  const { _ } = useLingui();
  const [currentAccent, setCurrentAccent] = useState<AccentColor>(
    () => (getPref(PREF_KEYS.ACCENT_COLOR) as AccentColor) || "pink",
  );
  const [customHex, setCustomHex] = useState(
    () => getPref(PREF_KEYS.CUSTOM_ACCENT_COLOR) || "#ff6600",
  );
  const { triggerProps: customTooltipProps, tooltip: customTooltip } =
    useTooltip({ content: _(msg`Custom`), describe: false });

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", currentAccent);
    if (currentAccent === "custom") {
      document.documentElement.style.setProperty("--accent-base", customHex);
    } else {
      document.documentElement.style.removeProperty("--accent-base");
    }
  }, [currentAccent, customHex]);

  const handleAccentChange = (accent: AccentColor) => {
    setCurrentAccent(accent);
    setPref(PREF_KEYS.ACCENT_COLOR, accent);
    document.documentElement.setAttribute("data-accent", accent);
  };

  const handleCustomColorChange = (hex: string) => {
    setCustomHex(hex);
    setPref(PREF_KEYS.CUSTOM_ACCENT_COLOR, hex);
    if (currentAccent !== "custom") {
      handleAccentChange("custom");
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <FaDroplet className={styles.sectionIcon} />
        <h3 className={styles.sectionTitle}>{_(msg`Accent Color`)}</h3>
      </div>
      <div className={styles.colorGrid}>
        {ACCENT_COLORS.map((accent) => (
          <TooltipButton
            key={accent.value}
            tooltip={_(accent.label)}
            tooltipIsLabel
            className={cn(styles.colorButton, {
              [styles.selected]: currentAccent === accent.value,
            })}
            onClick={() => handleAccentChange(accent.value)}
            aria-pressed={currentAccent === accent.value}
            style={{ "--swatch-color": accent.color } as React.CSSProperties}
          >
            <span className={styles.colorSwatch} />
            {currentAccent === accent.value && (
              <FaCheck className={styles.colorCheck} />
            )}
          </TooltipButton>
        ))}
        <div
          className={cn(styles.colorButton, {
            [styles.selected]: currentAccent === "custom",
          })}
          {...customTooltipProps}
          aria-pressed={currentAccent === "custom"}
          aria-label={_(msg`Custom`)}
        >
          <ColorInput
            color={customHex}
            onChange={handleCustomColorChange}
            onClick={() => handleAccentChange("custom")}
            className={styles.customColorInput}
          />
          {currentAccent === "custom" && (
            <FaCheck className={styles.colorCheck} />
          )}
        </div>
        {customTooltip}
      </div>
    </section>
  );
};
