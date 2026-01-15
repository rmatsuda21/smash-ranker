import { useState, useEffect } from "react";
import { FaGlobe, FaPalette, FaCheck } from "react-icons/fa6";
import Cookies from "js-cookie";

import { loadCatalog } from "@/i18n";
import { COOKIES } from "@/consts/cookies";

import styles from "./SettingsPanel.module.scss";

type Props = {
  className?: string;
};

type Language = "en" | "ja";
type Theme = "dark" | "light";

const LANGUAGES: { value: Language; label: string; nativeLabel: string }[] = [
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "ja", label: "Japanese", nativeLabel: "日本語" },
];

const THEMES: { value: Theme; label: string; icon: string }[] = [
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "light", label: "Light", icon: "☀️" },
];

export const SettingsPanel = ({ className }: Props) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    () => (Cookies.get(COOKIES.LANGUAGE) as Language) || "en"
  );
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    () => (Cookies.get(COOKIES.THEME) as Theme) || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  const handleLanguageChange = async (language: Language) => {
    setCurrentLanguage(language);
    Cookies.set(COOKIES.LANGUAGE, language, { expires: 365 });
    await loadCatalog(language);
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    Cookies.set(COOKIES.THEME, theme, { expires: 365 });
    document.documentElement.setAttribute("data-theme", theme);
  };

  return (
    <div className={className}>
      <div className={styles.settings}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaGlobe className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>Language</h3>
          </div>
          <p className={styles.sectionDesc}>
            Select your preferred language for the interface
          </p>
          <div className={styles.optionGrid}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                className={`${styles.optionButton} ${
                  currentLanguage === lang.value ? styles.selected : ""
                }`}
                onClick={() => handleLanguageChange(lang.value)}
                aria-pressed={currentLanguage === lang.value}
              >
                <span className={styles.optionLabel}>{lang.nativeLabel}</span>
                <span className={styles.optionSubLabel}>{lang.label}</span>
                {currentLanguage === lang.value && (
                  <FaCheck className={styles.checkIcon} />
                )}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaPalette className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>Theme</h3>
          </div>
          <p className={styles.sectionDesc}>
            Choose your preferred color scheme
          </p>
          <div className={styles.optionGrid}>
            {THEMES.map((theme) => (
              <button
                key={theme.value}
                className={`${styles.optionButton} ${
                  currentTheme === theme.value ? styles.selected : ""
                }`}
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

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>About Settings</h3>
          <p className={styles.sectionDesc}>
            Your preferences are automatically saved and will persist across
            sessions.
          </p>
        </section>
      </div>
    </div>
  );
};
