import { Suspense, useState } from "react";
import { FaArrowUpFromBracket } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { Modal } from "@/components/shared/Modal/Modal";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { useCanvasStore } from "@/store/canvasStore";
import { LazySocialPostComposer } from "@/components/top8/SocialPostComposer";

import styles from "./SocialShareButton.module.scss";

type Props = {
  className?: string;
};

export const SocialShareButton = ({ className }: Props) => {
  const { _ } = useLingui();
  const [isOpen, setIsOpen] = useState(false);
  const stageRef = useCanvasStore((state) => state.stageRef);

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
          <LazySocialPostComposer onClose={() => setIsOpen(false)} />
        </Suspense>
      </Modal>
    </div>
  );
};
