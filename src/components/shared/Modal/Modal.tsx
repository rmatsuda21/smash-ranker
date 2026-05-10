import { createPortal } from "react-dom";

import { useDismissOnEscape } from "@/hooks/useDismiss";

import styles from "./Modal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const Modal = ({
  children,
  isOpen,
  onClose,
}: React.PropsWithChildren<Props>) => {
  useDismissOnEscape({ enabled: isOpen, onDismiss: onClose });

  return createPortal(
    isOpen ? (
      <div className={styles.modal}>
        <div className={styles.overlay} onClick={onClose} />
        <div className={styles.content}>{children}</div>
      </div>
    ) : null,
    document.getElementById("root")!.children[0] ||
      document.getElementById("root")!,
  );
};
