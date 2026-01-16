import { useState, useEffect } from "react";
import { FaDroplet, FaCheck } from "react-icons/fa6";
import Cookies from "js-cookie";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { MessageDescriptor } from "@lingui/core";
import { useLingui } from "@lingui/react";

import { COOKIES } from "@/consts/cookies";
import { useTooltip } from "@/components/shared/Tooltip/useTooltip";
import { Tooltip } from "@/components/shared/Tooltip/Tooltip";

import styles from "./SettingsPanel.module.scss";

type AccentColor = "pink" | "crimson" | "amber" | "blue" | "green" | "purple";

const ACCENT_COLORS: {
  value: AccentColor;
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
    () => (Cookies.get(COOKIES.ACCENT_COLOR) as AccentColor) || "pink"
  );

  const [tooltipRef, tooltip] = useTooltip();

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", currentAccent);
  }, [currentAccent]);

  const handleAccentChange = (accent: AccentColor) => {
    setCurrentAccent(accent);
    Cookies.set(COOKIES.ACCENT_COLOR, accent, { expires: 365 });
    document.documentElement.setAttribute("data-accent", accent);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <FaDroplet className={styles.sectionIcon} />
        <h3 className={styles.sectionTitle}>{_(msg`Accent Color`)}</h3>
      </div>
      <div className={styles.colorGrid}>
        {ACCENT_COLORS.map((accent) => (
          <button
            key={accent.value}
            className={cn(styles.colorButton, {
              [styles.selected]: currentAccent === accent.value,
            })}
            onClick={() => handleAccentChange(accent.value)}
            onMouseEnter={() => tooltip.show(_(accent.label))}
            onMouseLeave={() => tooltip.hide()}
            aria-pressed={currentAccent === accent.value}
            aria-label={_(accent.label)}
            style={{ "--swatch-color": accent.color } as React.CSSProperties}
          >
            <span className={styles.colorSwatch} />
            {currentAccent === accent.value && (
              <FaCheck className={styles.colorCheck} />
            )}
          </button>
        ))}
        <Tooltip tooltipRef={tooltipRef} />
      </div>
    </section>
  );
};
