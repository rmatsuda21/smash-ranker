import { useState } from "react";
import Cookies from "js-cookie";

import { Modal } from "@/components/shared/Modal/Modal";
import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";

import styles from "./ConfirmationModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  cookieName?: string;
};

const CookieInput = ({
  isDoNotShowAgain,
  setIsDoNotShowAgain,
}: {
  isDoNotShowAgain: boolean;
  setIsDoNotShowAgain: (isDoNotShowAgain: boolean) => void;
}) => {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDoNotShowAgain(e.currentTarget.checked);
  };

  return (
    <div className={styles.cookieInput}>
      <span>Don't show again</span>
      <Input
        type="checkbox"
        onChange={handleCheckboxChange}
        checked={isDoNotShowAgain}
        size={12}
      />
    </div>
  );
};

export const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  onConfirm,
  onCancel,
  cookieName,
}: React.PropsWithChildren<Props>) => {
  const [isDoNotShowAgain, setIsDoNotShowAgain] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    if (cookieName) {
      Cookies.set(cookieName, isDoNotShowAgain ? "true" : "false");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        <h1>{title}</h1>
        <p>{description}</p>
        {cookieName && (
          <CookieInput
            isDoNotShowAgain={isDoNotShowAgain}
            setIsDoNotShowAgain={setIsDoNotShowAgain}
          />
        )}
        {children}
        <div className={styles.buttons}>
          <Button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </Button>
          <Button className={styles.confirmButton} onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};
