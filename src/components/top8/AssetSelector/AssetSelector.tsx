import { useEffect, useState } from "react";
import { FaImage, FaTrash } from "react-icons/fa6";
import { GrDocumentMissing } from "react-icons/gr";

import { Modal } from "@/components/shared/Modal/Modal";
import { Button } from "@/components/shared/Button/Button";
import { assetRepository } from "@/db/repository";
import styles from "./AssetSelector.module.scss";
import { DBAsset } from "@/types/Repository";

type Props = {
  selectedId?: string;
  onSelect: (id: string) => void;
  onClear: () => void;
};

export const AssetSelector = ({ selectedId, onSelect, onClear }: Props) => {
  const [assets, setAssets] = useState<DBAsset[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [img, setImg] = useState<Blob | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSelect = (id: string) => {
    onSelect(id);
  };

  useEffect(() => {
    if (!selectedId) {
      setImg(null);
      setNotFound(false);
      return;
    }

    assetRepository.get(selectedId).then((asset) => {
      if (asset?.data) {
        setImg(asset.data);
      } else {
        setImg(null);
        setNotFound(true);
      }
    });
  }, [selectedId]);

  useEffect(() => {
    const getAssets = async () => {
      const assets = await assetRepository.getAll();
      return assets;
    };

    getAssets().then((assets) => setAssets(assets));
  }, [isOpen]);

  return (
    <div className={styles.assetSelector}>
      <div className={styles.imgContainer}>
        {notFound && <GrDocumentMissing size={50} />}
        {img && <img src={URL.createObjectURL(img)} alt="Background Image" />}
      </div>
      <div className={styles.buttons}>
        <Button onClick={() => setIsOpen(true)}>
          <FaImage /> Manage
        </Button>
        <Button
          onClick={() => {
            onClear();
          }}
        >
          <FaTrash /> Clear
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className={styles.assetSelector}>
          <h3>Assets</h3>
          <div className={styles.assets}>
            {assets.map((asset) => (
              <div
                key={asset.id}
                className={styles.asset}
                onClick={() => handleSelect(asset.id)}
              >
                <img
                  src={URL.createObjectURL(asset.data)}
                  alt={asset.fileName}
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
