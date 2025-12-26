import { useState, useCallback } from "react";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal/ConfirmationModal";

type ConfirmationConfig = {
  title: string;
  description: string;
};

type UseConfirmationReturn<T extends unknown[]> = {
  confirm: (...args: T) => void;
  ConfirmationDialog: React.FC;
};

export function useConfirmation<T extends unknown[]>(
  onConfirm: (...args: T) => void | Promise<void>,
  config: ConfirmationConfig
): UseConfirmationReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingArgs, setPendingArgs] = useState<T | null>(null);

  const confirm = useCallback((...args: T) => {
    setPendingArgs(args);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (pendingArgs) {
      await onConfirm(...pendingArgs);
    }
    setIsOpen(false);
    setPendingArgs(null);
  }, [onConfirm, pendingArgs]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setPendingArgs(null);
  }, []);

  const ConfirmationDialog: React.FC = useCallback(
    () => (
      <ConfirmationModal
        isOpen={isOpen}
        onClose={handleCancel}
        title={config.title}
        description={config.description}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ),
    [isOpen, handleCancel, handleConfirm, config.title, config.description]
  );

  return { confirm, ConfirmationDialog };
}
