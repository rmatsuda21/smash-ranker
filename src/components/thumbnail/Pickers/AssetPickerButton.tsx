import { useState } from "react";
import { FaImage, FaPenToSquare, FaXmark } from "react-icons/fa6";

import { AssetsModal } from "@/components/top8/AssetManager/AssetsModal/AssetsModal";
import { thumbnailAssetRepository } from "@/db/repository";

import styles from "./AssetPickerButton.module.scss";

type Props = {
  src: string | undefined;
  onChange: (src: string) => void;
  onClear?: () => void;
  label?: string;
};

export const AssetPickerButton = ({
  src,
  onChange,
  onClear,
  label = "Image",
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasSrc = Boolean(src);

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.preview}
        onClick={() => setIsOpen(true)}
        aria-label={hasSrc ? `Change ${label.toLowerCase()}` : `Pick ${label.toLowerCase()}`}
      >
        {hasSrc ? (
          <>
            <img src={src} alt={label} />
            <span className={styles.overlay}>
              <FaPenToSquare />
              Change
            </span>
          </>
        ) : (
          <span className={styles.placeholder}>
            <FaImage />
            Pick {label.toLowerCase()}
          </span>
        )}
      </button>
      {hasSrc && onClear ? (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={onClear}
          aria-label="Clear"
          title="Clear"
        >
          <FaXmark />
        </button>
      ) : null}
      <AssetsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={(picked) => {
          onChange(picked);
          setIsOpen(false);
        }}
        selectedSrc={src}
        repository={thumbnailAssetRepository}
      />
    </div>
  );
};
