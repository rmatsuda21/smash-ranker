import { useState, useEffect } from "react";
import { FaPalette, FaCheck } from "react-icons/fa6";
import Cookies from "js-cookie";
import cn from "classnames";

import { COOKIES } from "@/consts/cookies";

import styles from "./SettingsPanel.module.scss";

type Theme = "dark" | "light";

const THEMES: { value: Theme; label: string; icon: string }[] = [
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "light", label: "Light", icon: "☀️" },
];

export const ThemePicker = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    () => (Cookies.get(COOKIES.THEME) as Theme) || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    Cookies.set(COOKIES.THEME, theme, { expires: 365 });
    document.documentElement.setAttribute("data-theme", theme);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <FaPalette className={styles.sectionIcon} />
        <h3 className={styles.sectionTitle}>Theme</h3>
      </div>
      <p className={styles.sectionDesc}>Choose your preferred color scheme</p>
      <div className={styles.optionGrid}>
        {THEMES.map((theme) => (
          <button
            key={theme.value}
            className={cn(styles.optionButton, {
              [styles.selected]: currentTheme === theme.value,
            })}
            onClick={() => handleThemeChange(theme.value)}
            aria-pressed={currentTheme === theme.value}
          >
            <span className={styles.themeIcon}>{theme.icon}</span>
            <span className={styles.optionLabel}>{theme.label}</span>
            {currentTheme === theme.value && (
              <FaCheck className={styles.checkIcon} />
            )}
          </button>
        ))}
      </div>
    </section>
  );
};
