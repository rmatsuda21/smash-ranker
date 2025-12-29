import { useEffect, useState } from "react";
import { FaImage, FaTrash } from "react-icons/fa6";
import { GrDocumentMissing } from "react-icons/gr";
import { RxValueNone } from "react-icons/rx";

import { AssetsModal } from "@/components/top8/AssetManager/AssetsModal/AssetsModal";
import { Button } from "@/components/shared/Button/Button";
import { assetRepository } from "@/db/repository";

import styles from "./AssetSelector.module.scss";

type Props = {
  selectedSrc?: string;
  onSelect?: (src: string) => void;
  onClear: () => void;
};

export const AssetSelector = ({ selectedSrc, onSelect, onClear }: Props) => {
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

  return (
    <div className={styles.assetSelector}>
      <div className={styles.imgContainer}>
        {notFound && <GrDocumentMissing size={50} />}
        {!notFound &&
          (img ? (
            <img src={URL.createObjectURL(img)} alt="Background Image" />
          ) : (
            <RxValueNone color="var(--gray-5)" size={50} />
          ))}
      </div>
      <div className={styles.buttons}>
        <Button onClick={() => setIsOpen(true)}>
          <FaImage /> Select
        </Button>
        <Button
          onClick={() => {
            onClear();
          }}
        >
          <FaTrash /> Clear
        </Button>
      </div>

      <AssetsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={onSelect}
      />
    </div>
  );
};
