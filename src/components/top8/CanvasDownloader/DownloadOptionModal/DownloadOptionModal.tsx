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
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <div className={styles.modal}>
        <h3>Download Options</h3>
        <div className={styles.inputs}>
          <Input
            label="Quality"
            type="number"
            value={quality}
            onChange={(e) => setQuality(Number(e.currentTarget.value))}
          />
          <Input
            label="Pixel Ratio"
            type="number"
            value={pixelRatio}
            onChange={(e) => setPixelRatio(Number(e.currentTarget.value))}
          />
        </div>
        <Button onClick={() => setIsOpen(false)}>Okay</Button>
      </div>
    </Modal>
  );
};
