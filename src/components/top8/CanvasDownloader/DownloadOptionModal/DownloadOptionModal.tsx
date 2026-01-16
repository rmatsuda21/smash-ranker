import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { Modal } from "@/components/shared/Modal/Modal";

import styles from "./DownloadOptionModal.module.scss";

type Props = {
  quality: number;
  pixelRatio: number;
  setQuality: (quality: number) => void;
  setPixelRatio: (pixelRatio: number) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const DownloadOptionModal = ({
  quality,
  pixelRatio,
  setQuality,
  setPixelRatio,
  isOpen,
  setIsOpen,
}: Props) => {
  const { _ } = useLingui();

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <div className={styles.modal}>
        <h3>
          <Trans>Download Options</Trans>
        </h3>
        <div className={styles.inputs}>
          <Input
            label={_(msg`Quality`)}
            type="number"
            value={quality}
            onChange={(e) => setQuality(Number(e.currentTarget.value))}
          />
          <Input
            label={_(msg`Pixel Ratio`)}
            type="number"
            value={pixelRatio}
            onChange={(e) => setPixelRatio(Number(e.currentTarget.value))}
          />
        </div>
        <Button onClick={() => setIsOpen(false)}>
          <Trans>Okay</Trans>
        </Button>
      </div>
    </Modal>
  );
};
