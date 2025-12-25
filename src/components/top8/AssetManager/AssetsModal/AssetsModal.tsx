import { useState } from "react";
import cn from "classnames";

import { Modal } from "@/components/shared/Modal/Modal";
import { useAssetDB } from "@/hooks/useAssetDb";
import { FileUploader } from "@/components/shared/FileUploader/FileUploader";

import styles from "./AssetsModal.module.scss";
import { RiDeleteBin6Fill } from "react-icons/ri";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const AssetsModal = ({ isOpen, onClose }: Props) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");

  const { assets, uploadAsset, deleteAsset } = useAssetDB();

  if (!isOpen) return null;

  const handleUpload = (files?: File[]) => {
    for (const file of files ?? []) {
      if (file.size > 2 * 1024 * 1024) {
        alert(`${file.name} is too large! (Max 2MB)`);
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

  const handleAssetClick = (id: string) => {
    if (selectedAssetId === id) {
      deleteAsset(id);
    }

    setSelectedAssetId(id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.assetsModal}>
        <h3>Assets</h3>
        <div className={styles.assets}>
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={cn(styles.asset, {
                [styles.selected]: asset.id === selectedAssetId,
              })}
              onClick={() => handleAssetClick(asset.id)}
            >
              <div className={styles.deleteButton}>
                <RiDeleteBin6Fill />
              </div>
              <img src={URL.createObjectURL(asset.data)} alt={asset.fileName} />
            </div>
          ))}
        </div>
      </div>
      <FileUploader onChange={handleUpload} multiple />
    </Modal>
  );
};
