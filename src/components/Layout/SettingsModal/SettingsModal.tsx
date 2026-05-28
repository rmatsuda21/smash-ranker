import { useState } from "react";
import { MdBugReport, MdClose } from "react-icons/md";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Modal } from "@/components/shared/Modal/Modal";
import { ThemePicker } from "@/components/top8/SettingsPanel/ThemePicker";
import { LanguagePicker } from "@/components/top8/SettingsPanel/LanguagePicker";
import { AccentColorPicker } from "@/components/top8/SettingsPanel/AccentColorPicker";
import { DeveloperSettings } from "@/components/top8/SettingsPanel/DeveloperSettings";

import styles from "./SettingsModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const SettingsModal = ({ isOpen, onClose }: Props) => {
  const { _ } = useLingui();
  const [devMode, setDevMode] = useState(false);

  const handleClose = () => {
    setDevMode(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>{_(msg`Settings`)}</h2>
          <div className={styles.headerActions}>
            <button
              className={cn(styles.iconButton, {
                [styles.iconButtonActive]: devMode,
              })}
              onClick={() => setDevMode((v) => !v)}
              aria-pressed={devMode}
              aria-label={_(msg`Toggle developer settings`)}
            >
              <MdBugReport />
            </button>
            <button
              className={styles.iconButton}
              onClick={handleClose}
              aria-label={_(msg`Close`)}
            >
              <MdClose />
            </button>
          </div>
        </div>
        <div className={styles.body}>
          <ThemePicker />
          <LanguagePicker />
          <AccentColorPicker />
          {devMode && <DeveloperSettings />}
        </div>
      </div>
    </Modal>
  );
};
