import { useState, useCallback, useRef } from "react";
import Cookies from "js-cookie";

import { ConfirmationModal } from "@/components/shared/ConfirmationModal/ConfirmationModal";

type ConfirmationConfig = {
  title: string;
  description: string;
  cookieName?: string;
};

type UseConfirmationReturn<T extends unknown[]> = {
  confirm: (...args: T) => void;
  ConfirmationDialog: React.FC<React.PropsWithChildren<unknown>>;
};

export function useConfirmation<T extends unknown[]>(
  onConfirm: (...args: T) => void | Promise<void>,
  config: ConfirmationConfig
): UseConfirmationReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingArgs, setPendingArgs] = useState<T | null>(null);

  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  const pendingArgsRef = useRef(pendingArgs);
  pendingArgsRef.current = pendingArgs;

  const configRef = useRef(config);
  configRef.current = config;

  const confirm = useCallback(
    (...args: T) => {
      if (configRef.current.cookieName) {
        if (Cookies.get(configRef.current.cookieName) === "true") {
          onConfirmRef.current(...args);
          return;
        }
      }

      setPendingArgs(args);
      setIsOpen(true);
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    if (pendingArgsRef.current) {
      await onConfirmRef.current(...pendingArgsRef.current);
    }
    setIsOpen(false);
    setPendingArgs(null);
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setPendingArgs(null);
  }, []);

  const ConfirmationDialog: React.FC = useCallback(
    () => (
      <ConfirmationModal
        isOpen={isOpen}
        onClose={handleCancel}
        title={configRef.current.title}
        description={configRef.current.description}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        cookieName={configRef.current.cookieName}
      />
    ),
    [isOpen, handleCancel, handleConfirm]
  );

  return { confirm, ConfirmationDialog };
}
