import { useState } from "react";
import { FaGlobe, FaCheck } from "react-icons/fa6";
import Cookies from "js-cookie";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { MessageDescriptor } from "@lingui/core";
import { useLingui } from "@lingui/react";

import { loadCatalog } from "@/i18n";
import { COOKIES } from "@/consts/cookies";

import styles from "./SettingsPanel.module.scss";

type Language = "en" | "ja";

const LANGUAGES: {
  value: Language;
  label: MessageDescriptor;
  nativeLabel: string;
}[] = [
  { value: "en", label: msg`English`, nativeLabel: "English" },
  { value: "ja", label: msg`Japanese`, nativeLabel: "日本語" },
];

export const LanguagePicker = () => {
  const { _ } = useLingui();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    () => (Cookies.get(COOKIES.LANGUAGE) as Language) || "en"
  );

  const handleLanguageChange = async (language: Language) => {
    setCurrentLanguage(language);
    Cookies.set(COOKIES.LANGUAGE, language, { expires: 365 });
    await loadCatalog(language);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <FaGlobe className={styles.sectionIcon} />
        <h3 className={styles.sectionTitle}>{_(msg`Language`)}</h3>
      </div>
      <div className={styles.optionGrid}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.value}
            className={cn(styles.optionButton, {
              [styles.selected]: currentLanguage === lang.value,
            })}
            onClick={() => handleLanguageChange(lang.value)}
            aria-pressed={currentLanguage === lang.value}
          >
            <span className={styles.optionLabel}>{lang.nativeLabel}</span>
            <span className={styles.optionSubLabel}>{_(lang.label)}</span>
            {currentLanguage === lang.value && (
              <FaCheck className={styles.checkIcon} />
            )}
          </button>
        ))}
      </div>
    </section>
  );
};
