import { Modal } from "@/components/shared/Modal/Modal";
import { Button } from "@/components/shared/Button/Button";

import styles from "./ConfirmationModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  onConfirm,
  onCancel,
}: React.PropsWithChildren<Props>) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
        <div className={styles.buttons}>
          <Button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </Button>
          <Button className={styles.confirmButton} onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};
