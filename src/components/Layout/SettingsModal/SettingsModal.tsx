import { MdClose } from "react-icons/md";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Modal } from "@/components/shared/Modal/Modal";
import { ThemePicker } from "@/components/top8/SettingsPanel/ThemePicker";
import { LanguagePicker } from "@/components/top8/SettingsPanel/LanguagePicker";
import { AccentColorPicker } from "@/components/top8/SettingsPanel/AccentColorPicker";

import styles from "./SettingsModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const SettingsModal = ({ isOpen, onClose }: Props) => {
  const { _ } = useLingui();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>{_(msg`Settings`)}</h2>
          <button
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            <MdClose />
          </button>
        </div>
        <div className={styles.body}>
          <ThemePicker />
          <LanguagePicker />
          <AccentColorPicker />
        </div>
      </div>
    </Modal>
  );
};
