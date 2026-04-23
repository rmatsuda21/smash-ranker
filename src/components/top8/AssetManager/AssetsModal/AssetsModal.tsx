import { useEffect, useRef, useState } from "react";
import { FaUpload } from "react-icons/fa6";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Modal } from "@/components/shared/Modal/Modal";
import { Button } from "@/components/shared/Button/Button";
import { useAssetDB } from "@/hooks/useAssetDb";
import { useConfirmation } from "@/hooks/useConfirmation";
import { DBAsset } from "@/types/Repository";

import { AssetGrid } from "./AssetGrid/AssetGrid";
import { AssetPreview } from "./AssetPreview/AssetPreview";

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
  const [previewAsset, setPreviewAsset] = useState<DBAsset | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const lastMarkedIdRef = useRef<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { assets, uploadAsset, deleteAsset, refresh } = useAssetDB();

  const { confirm: confirmDelete, ConfirmationDialog } = useConfirmation(
    async (id: string) => {
      await deleteAsset(id);
      if (previewAsset?.id === id) {
        setPreviewAsset(null);
      }
    },
    {
      title: _(msg`Delete Asset`),
      description: _(msg`Are you sure you want to delete this asset?`),
    }
  );

  const { confirm: confirmBulkDelete, ConfirmationDialog: BulkDeleteDialog } =
    useConfirmation(
      async (ids: string[]) => {
        for (const id of ids) {
          await deleteAsset(id);
        }
        if (previewAsset && ids.includes(previewAsset.id)) {
          setPreviewAsset(null);
        }
        setMarkedIds(new Set());
      },
      {
        title: _(msg`Delete Assets`),
        description: _(
          msg`Are you sure you want to delete ${markedIds.size} assets?`
        ),
      }
    );

  useEffect(() => {
    if (isOpen) {
      refresh();
      setMarkedIds(new Set());
    }
  }, [isOpen, refresh]);

  useEffect(() => {
    setSelectedAssetSrc(selectedSrc ?? "");
  }, [selectedSrc]);

  // Clear stale preview if asset was deleted externally
  useEffect(() => {
    if (previewAsset && !assets.find((a) => a.id === previewAsset.id)) {
      setPreviewAsset(null);
    }
  }, [assets, previewAsset]);

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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      handleUpload(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleThumbnailClick = (asset: DBAsset) => {
    setPreviewAsset(asset);
    setZoomLevel(100);
  };

  const handleToggleMark = (id: string, shiftKey: boolean) => {
    if (shiftKey && lastMarkedIdRef.current) {
      // Range select: mark all assets between last marked and current
      const lastIdx = assets.findIndex(
        (a) => a.id === lastMarkedIdRef.current
      );
      const currIdx = assets.findIndex((a) => a.id === id);
      if (lastIdx !== -1 && currIdx !== -1) {
        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        setMarkedIds((prev) => {
          const next = new Set(prev);
          for (let i = start; i <= end; i++) {
            next.add(assets[i].id);
          }
          return next;
        });
        return;
      }
    }

    setMarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    lastMarkedIdRef.current = id;
  };

  const handleBulkDelete = () => {
    confirmBulkDelete([...markedIds]);
  };

  const handleSelectFromPreview = () => {
    if (previewAsset) {
      setSelectedAssetSrc(previewAsset.src);
      onSelect?.(previewAsset.src);
    }
  };

  const handleDeleteFromPreview = () => {
    if (previewAsset) {
      confirmDelete(previewAsset.id);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.assetsModal}>
        <div className={styles.header}>
          <h3>
            <Trans>Assets</Trans>
          </h3>
          <div className={styles.headerActions}>
            {assets.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (markedIds.size === assets.length) {
                    setMarkedIds(new Set());
                  } else {
                    setMarkedIds(new Set(assets.map((a) => a.id)));
                  }
                }}
              >
                {markedIds.size === assets.length ? (
                  <Trans>Deselect All</Trans>
                ) : (
                  <Trans>Select All</Trans>
                )}
              </Button>
            )}
            {markedIds.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className={styles.bulkDeleteButton}
              >
                <RiDeleteBin6Fill size={12} />
                <Trans>Delete ({markedIds.size})</Trans>
              </Button>
            )}
            <div className={styles.uploadWrapper}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                className={styles.hiddenInput}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                tooltip={_(msg`Upload Assets`)}
              >
                <FaUpload size={12} />
                <Trans>Upload</Trans>
              </Button>
            </div>
          </div>
        </div>
        <div className={styles.body}>
          <AssetGrid
            assets={assets}
            selectedSrc={selectedAssetSrc}
            previewAssetId={previewAsset?.id}
            markedIds={markedIds}
            onThumbnailClick={handleThumbnailClick}
            onToggleMark={handleToggleMark}
            onUpload={handleUpload}
          />
          <AssetPreview
            asset={previewAsset}
            isSelected={previewAsset?.src === selectedAssetSrc}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            onSelect={onSelect ? handleSelectFromPreview : undefined}
            onDelete={handleDeleteFromPreview}
          />
        </div>
      </div>
      <ConfirmationDialog />
      <BulkDeleteDialog />
    </Modal>
  );
};
