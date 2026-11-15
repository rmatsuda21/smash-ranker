import { useState, useCallback, useRef } from "react";

import { ConfirmationModal } from "@/components/shared/ConfirmationModal/ConfirmationModal";
import { getPref } from "@/utils/prefs";

type ConfirmationConfig = {
  title: string;
  description: string;
  /** Storage key for "Don't show again". Omit to always ask. */
  rememberKey?: string;
};

type UseConfirmationReturn<T extends unknown[]> = {
  confirm: (...args: T) => void;
  /** Render this once anywhere in the calling component. */
  confirmationDialog: React.ReactNode;
};

export function useConfirmation<T extends unknown[]>(
  onConfirm: (...args: T) => void | Promise<void>,
  config: ConfirmationConfig,
): UseConfirmationReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingArgs, setPendingArgs] = useState<T | null>(null);

  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  const pendingArgsRef = useRef(pendingArgs);
  pendingArgsRef.current = pendingArgs;

  const configRef = useRef(config);
  configRef.current = config;

  const confirm = useCallback((...args: T) => {
    if (configRef.current.rememberKey) {
      if (getPref(configRef.current.rememberKey) === "true") {
        onConfirmRef.current(...args);
        return;
      }
    }

    setPendingArgs(args);
    setIsOpen(true);
  }, []);

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

  const confirmationDialog = (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={config.title}
      description={config.description}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      rememberKey={config.rememberKey}
    />
  );

  return { confirm, confirmationDialog };
}
