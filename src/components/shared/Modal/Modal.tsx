import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { registerModal } from "./modalStack";

import styles from "./Modal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Id of the heading that names the dialog. */
  "aria-labelledby"?: string;
  /** Accessible name when there is no visible heading. */
  "aria-label"?: string;
};

// `closedby="any"` adds click-outside dismissal natively. Not yet in Safari,
// which gets the pointer fallback below.
const SUPPORTS_CLOSEDBY =
  typeof HTMLDialogElement !== "undefined" &&
  "closedBy" in HTMLDialogElement.prototype;

const isOnBackdrop = (e: PointerEvent, dialog: HTMLDialogElement) => {
  // Popovers and tooltips portalled into the dialog can sit outside its box,
  // so a position check alone isn't enough: the backdrop targets the dialog.
  if (e.target !== dialog) return false;
  const r = dialog.getBoundingClientRect();
  return (
    e.clientX < r.left ||
    e.clientX > r.right ||
    e.clientY < r.top ||
    e.clientY > r.bottom
  );
};

const ModalDialog = ({
  children,
  onClose,
  ...labelProps
}: React.PropsWithChildren<Omit<Props, "isOpen">>) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Lives in its own component so the cleanup runs (and focus returns to the
  // invoker) before React removes the <dialog> from the DOM.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    const unregister = registerModal(dialog);

    let cleanupFallback: (() => void) | undefined;
    if (!SUPPORTS_CLOSEDBY) {
      let pressedOnBackdrop = false;
      const onPointerDown = (e: PointerEvent) => {
        pressedOnBackdrop = isOnBackdrop(e, dialog);
      };
      // Require press and release on the backdrop so a text-selection drag
      // that ends outside the dialog doesn't dismiss it.
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOnBackdrop && isOnBackdrop(e, dialog)) dialog.close();
        pressedOnBackdrop = false;
      };
      dialog.addEventListener("pointerdown", onPointerDown);
      dialog.addEventListener("pointerup", onPointerUp);
      cleanupFallback = () => {
        dialog.removeEventListener("pointerdown", onPointerDown);
        dialog.removeEventListener("pointerup", onPointerUp);
      };
    }

    return () => {
      cleanupFallback?.();
      unregister();
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      onClose={(e) => {
        // Esc, the back gesture and click-outside close the dialog natively;
        // mirror that into React state. The `open` check skips the stale
        // event from StrictMode's close-then-reopen effect replay.
        if (!e.currentTarget.open) onClose();
      }}
      {...labelProps}
      {...({ closedby: "any" } as object)}
    >
      <div className={styles.content}>{children}</div>
    </dialog>
  );
};

export const Modal = ({
  children,
  isOpen,
  ...props
}: React.PropsWithChildren<Props>) => {
  return createPortal(
    isOpen ? <ModalDialog {...props}>{children}</ModalDialog> : null,
    document.getElementById("root")!.children[0] ||
      document.getElementById("root")!,
  );
};
