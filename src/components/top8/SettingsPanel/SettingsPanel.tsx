import { LanguagePicker } from "./LanguagePicker";
import { ThemePicker } from "./ThemePicker";
import { AccentColorPicker } from "./AccentColorPicker";

import styles from "./SettingsPanel.module.scss";

type Props = {
  className?: string;
};

export const SettingsPanel = ({ className }: Props) => {
  return (
    <div className={className}>
      <div className={styles.settings}>
        <LanguagePicker />
        <ThemePicker />
        <AccentColorPicker />

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
