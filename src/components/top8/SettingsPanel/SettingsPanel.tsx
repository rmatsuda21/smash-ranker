import { ThumbnailRegenButton } from "./ThumbnailRegenButton";

import styles from "./SettingsPanel.module.scss";

type Props = {
  className?: string;
};

export const SettingsPanel = ({ className }: Props) => {
  return (
    <div className={className}>
      <div className={styles.settings}>
        <ThumbnailRegenButton />
      </div>
    </div>
  );
};
