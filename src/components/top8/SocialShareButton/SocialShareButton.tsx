import { Suspense, useState } from "react";
import { FaArrowUpFromBracket } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { Modal } from "@/components/shared/Modal/Modal";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { useCanvasStore } from "@/store/canvasStore";
import { LazySocialPostComposer } from "@/components/top8/SocialPostComposer";
import type { StageBlobCache } from "@/hooks/top8/useStageBlobCache";

import styles from "./SocialShareButton.module.scss";

type Props = {
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  blobCache?: StageBlobCache;
};

export const SocialShareButton = ({
  className,
  isOpen: controlledIsOpen,
  onOpenChange,
  blobCache,
}: Props) => {
  const { _ } = useLingui();
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const stageRef = useCanvasStore((state) => state.stageRef);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;
  const setIsOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledIsOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className={className}>
      <div className={styles.wrapper}>
        <Button
          disabled={!stageRef}
          onClick={() => setIsOpen(true)}
          tooltip={_(msg`Share to social`)}
        >
          <FaArrowUpFromBracket size={16} />
        </Button>
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Suspense
          fallback={
            <div className={styles.suspenseFallback}>
              <Spinner size={28} />
            </div>
          }
        >
          <LazySocialPostComposer
            onClose={() => setIsOpen(false)}
            blobCache={blobCache}
          />
        </Suspense>
      </Modal>
    </div>
  );
};
