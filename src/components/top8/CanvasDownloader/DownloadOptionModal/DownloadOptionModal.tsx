import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { Modal } from "@/components/shared/Modal/Modal";
import { isMobile } from "@/utils/isMobile";

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
  const mobile = isMobile();
  const maxPixelRatio = mobile ? 2 : 4;

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
            min={0.5}
            max={maxPixelRatio}
            step={0.5}
            onChange={(e) => {
              const val = Number(e.currentTarget.value);
              setPixelRatio(Math.min(Math.max(val, 0.5), maxPixelRatio));
            }}
          />
        </div>
        <Button onClick={() => setIsOpen(false)}>
          <Trans>Okay</Trans>
        </Button>
      </div>
    </Modal>
  );
};
