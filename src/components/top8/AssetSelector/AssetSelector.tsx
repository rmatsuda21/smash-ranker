import { useEffect, useRef, useState } from "react";
import { FaImage, FaTrash } from "react-icons/fa6";
import { GrDocumentMissing } from "react-icons/gr";
import { RxValueNone } from "react-icons/rx";
import cn from "classnames";
import { useLingui } from "@lingui/react";
import { msg } from "@lingui/core/macro";

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
  const { _ } = useLingui();
  const [isOpen, setIsOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const prevBlobUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedSrc) {
      if (prevBlobUrl.current) {
        URL.revokeObjectURL(prevBlobUrl.current);
        prevBlobUrl.current = null;
      }
      setImgUrl(null);
      setNotFound(false);
      return;
    }

    assetRepository.get(selectedSrc).then((asset) => {
      if (asset?.data) {
        if (prevBlobUrl.current) {
          URL.revokeObjectURL(prevBlobUrl.current);
        }
        const url = URL.createObjectURL(asset.data);
        prevBlobUrl.current = url;
        setImgUrl(url);
      } else {
        setImgUrl(null);
        setNotFound(true);
      }
    });

    return () => {
      if (prevBlobUrl.current) {
        URL.revokeObjectURL(prevBlobUrl.current);
        prevBlobUrl.current = null;
      }
    };
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
        {notFound && <GrDocumentMissing size={24} />}
        {!notFound &&
          (imgUrl ? (
            <img src={imgUrl} alt="Background Image" />
          ) : (
            <RxValueNone color="var(--gray-5)" size={24} />
          ))}
      </div>
      <div className={styles.buttons}>
        <Button
          size="sm"
          onClick={openModal}
          disabled={disabled}
          tooltip={_(msg`Select`)}
        >
          <FaImage />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onClear()}
          disabled={disabled || !selectedSrc}
          tooltip={_(msg`Clear`)}
        >
          <FaTrash />
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
