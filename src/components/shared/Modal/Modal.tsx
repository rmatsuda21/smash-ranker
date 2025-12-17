import { createPortal } from "react-dom";

import styles from "./Modal.module.scss";

type Props = {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
};

export const Modal = ({ children, isOpen, onClose }: Props) => {
  return createPortal(
    isOpen ? (
      <div className={styles.modal}>
        <div className={styles.overlay} onClick={onClose} />
        <div className={styles.content}>{children}</div>
      </div>
    ) : null,
    document.getElementById("root")!.children[0]
  );
};
