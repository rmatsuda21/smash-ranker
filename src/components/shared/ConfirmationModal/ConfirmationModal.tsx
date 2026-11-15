import { useId, useState } from "react";
import { Trans } from "@lingui/react/macro";

import { Modal } from "@/components/shared/Modal/Modal";
import { Button } from "@/components/shared/Button/Button";
import { Checkbox } from "@/components/shared/Checkbox/Checkbox";
import { setPref } from "@/utils/prefs";

import styles from "./ConfirmationModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  rememberKey?: string;
};

export const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  onConfirm,
  onCancel,
  rememberKey,
}: React.PropsWithChildren<Props>) => {
  const [isDoNotShowAgain, setIsDoNotShowAgain] = useState(false);
  const titleId = useId();

  const handleConfirm = () => {
    onConfirm();
    if (rememberKey) {
      setPref(rememberKey, isDoNotShowAgain ? "true" : "false");
    }
    setIsDoNotShowAgain(false);
  };

  // The modal stays mounted between uses, so clear the checkbox on the way
  // out rather than carrying a cancelled tick into the next confirmation.
  const handleClose = () => {
    setIsDoNotShowAgain(false);
    onClose();
  };

  const handleCancel = () => {
    setIsDoNotShowAgain(false);
    onCancel();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} aria-labelledby={titleId}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 id={titleId} className={styles.title}>
            {title}
          </h3>
          <p className={styles.description}>{description}</p>
        </div>
        {children}
        <div className={styles.buttons}>
          {rememberKey && (
            <div className={styles.rememberInput}>
              <Checkbox
                checked={isDoNotShowAgain}
                onChange={setIsDoNotShowAgain}
                label={<Trans>Don't show again</Trans>}
                size="sm"
              />
            </div>
          )}
          <Button variant="ghost" onClick={handleCancel}>
            <Trans>Cancel</Trans>
          </Button>
          <Button variant="solid" onClick={handleConfirm}>
            <Trans>Confirm</Trans>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
