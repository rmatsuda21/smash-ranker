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
      </div>
    </div>
  );
};
