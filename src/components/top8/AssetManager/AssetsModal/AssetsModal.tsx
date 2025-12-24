import { Modal } from "@/components/shared/Modal/Modal";
import { useAssetDB } from "@/hooks/useAssetDb";
import { FileUploader } from "@/components/shared/FileUploader/FileUploader";

import styles from "./AssetsModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const AssetsModal = ({ isOpen, onClose }: Props) => {
  const { assets, uploadAsset } = useAssetDB();

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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.assetsModal}>
        <h3>Assets</h3>
        <div className={styles.assets}>
          {assets.map((asset) => (
            <div key={asset.id} className={styles.asset}>
              <img src={URL.createObjectURL(asset.data)} alt={asset.fileName} />
            </div>
          ))}
        </div>
      </div>
      <FileUploader onChange={handleUpload} multiple />
    </Modal>
  );
};
