import { useEffect, useState } from "react";
import { FaImage, FaTrash } from "react-icons/fa6";
import { GrDocumentMissing } from "react-icons/gr";
import { RxValueNone } from "react-icons/rx";
import cn from "classnames";

import { AssetsModal } from "@/components/top8/AssetManager/AssetsModal/AssetsModal";
import { Button } from "@/components/shared/Button/Button";
import { assetRepository } from "@/db/repository";

import styles from "./AssetSelector.module.scss";

type Props = {
  selectedSrc?: string;
  onSelect?: (src: string) => void;
  onClear: () => void;
  disabled?: boolean;
};

export const AssetSelector = ({
  selectedSrc,
  onSelect,
  onClear,
  disabled,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [img, setImg] = useState<Blob | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!selectedSrc) {
      setImg(null);
      setNotFound(false);
      return;
    }

    assetRepository.get(selectedSrc).then((asset) => {
      if (asset?.data) {
        setImg(asset.data);
      } else {
        setImg(null);
        setNotFound(true);
      }
    });
  }, [selectedSrc]);

  const openModal = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  return (
    <div className={styles.assetSelector}>
      <div
        className={cn(styles.imgContainer, { [styles.disabled]: disabled })}
        onClick={openModal}
      >
        {notFound && <GrDocumentMissing size={50} />}
        {!notFound &&
          (img ? (
            <img src={URL.createObjectURL(img)} alt="Background Image" />
          ) : (
            <RxValueNone color="var(--gray-5)" size={50} />
          ))}
      </div>
      <div className={styles.buttons}>
        <Button onClick={openModal} disabled={disabled}>
          <FaImage /> Select
        </Button>
        <Button
          onClick={() => {
            onClear();
          }}
          disabled={disabled}
        >
          <FaTrash /> Clear
        </Button>
      </div>

      <AssetsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={onSelect}
        selectedSrc={selectedSrc}
      />
    </div>
  );
};
