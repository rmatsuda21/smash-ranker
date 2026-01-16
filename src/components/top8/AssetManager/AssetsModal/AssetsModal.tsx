import { useEffect, useState } from "react";
import cn from "classnames";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Modal } from "@/components/shared/Modal/Modal";
import { useAssetDB } from "@/hooks/useAssetDb";
import { FileUploader } from "@/components/shared/FileUploader/FileUploader";

import styles from "./AssetsModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (src: string) => void;
  selectedSrc?: string;
};

export const AssetsModal = ({
  isOpen,
  onClose,
  onSelect,
  selectedSrc,
}: Props) => {
  const { _ } = useLingui();
  const [selectedAssetSrc, setSelectedAssetSrc] = useState<string>(
    selectedSrc ?? ""
  );

  const { assets, uploadAsset, deleteAsset, refresh } = useAssetDB();

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  useEffect(() => {
    setSelectedAssetSrc(selectedSrc ?? "");
  }, [selectedSrc]);

  if (!isOpen) return null;

  const handleUpload = (files?: File[]) => {
    for (const file of files ?? []) {
      if (file.size > 2 * 1024 * 1024) {
        alert(_(msg`${file.name} is too large! (Max 2MB)`));
        continue;
      }

      const blob = new Blob([file], { type: file.type });
      uploadAsset({
        fileName: file.name,
        data: blob,
        date: new Date(),
      });
    }
  };

  const handleAssetClick = (src: string) => {
    if (selectedAssetSrc === src) {
      deleteAsset(src);
    }

    setSelectedAssetSrc(src);
    onSelect?.(src);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.assetsModal}>
        <h3>
          <Trans>Assets</Trans>
        </h3>
        <div className={styles.assets}>
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={cn(styles.asset, {
                [styles.selected]: asset.src === selectedAssetSrc,
              })}
              onClick={() => handleAssetClick(asset.src)}
            >
              <div className={styles.deleteButton}>
                <RiDeleteBin6Fill />
              </div>
              <img src={URL.createObjectURL(asset.data)} alt={asset.fileName} />
            </div>
          ))}
        </div>
        <FileUploader onChange={handleUpload} multiple />
      </div>
    </Modal>
  );
};
