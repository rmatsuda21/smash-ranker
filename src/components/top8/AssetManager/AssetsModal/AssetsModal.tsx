import { useEffect, useMemo, useRef, useState } from "react";
import { FaUpload, FaXmark } from "react-icons/fa6";
import { LuSearch } from "react-icons/lu";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Modal } from "@/components/shared/Modal/Modal";
import { Button } from "@/components/shared/Button/Button";
import { useAssetDB } from "@/hooks/useAssetDb";
import { useAssetUpload } from "@/hooks/useAssetUpload";
import { useConfirmation } from "@/hooks/useConfirmation";
import { DBAsset, Store } from "@/types/Repository";

import { AssetGrid } from "./AssetGrid/AssetGrid";
import { AssetPreview } from "./AssetPreview/AssetPreview";

import styles from "./AssetsModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (src: string) => void;
  selectedSrc?: string;
  repository?: Store<DBAsset>;
};

const hasFiles = (e: React.DragEvent) =>
  Array.from(e.dataTransfer.types).includes("Files");

export const AssetsModal = ({
  isOpen,
  onClose,
  onSelect,
  selectedSrc,
  repository,
}: Props) => {
  const { _ } = useLingui();
  const [selectedAssetSrc, setSelectedAssetSrc] = useState<string>(
    selectedSrc ?? "",
  );
  const [previewAsset, setPreviewAsset] = useState<DBAsset | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const lastMarkedIdRef = useRef<string | null>(null);
  const dragDepthRef = useRef(0);
  const didAutoPreviewRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { assets, uploadAsset, deleteAsset, refresh } = useAssetDB(repository);
  const upload = useAssetUpload(uploadAsset);

  // Newest first, narrowed by the search box.
  const visibleAssets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = [...assets].reverse();
    if (!needle) return sorted;
    return sorted.filter((a) => a.fileName.toLowerCase().includes(needle));
  }, [assets, query]);

  const { confirm: confirmDelete, confirmationDialog } = useConfirmation(
    async (id: string) => {
      await deleteAsset(id);
      if (previewAsset?.id === id) {
        setPreviewAsset(null);
      }
    },
    {
      title: _(msg`Delete Asset`),
      description: _(msg`Are you sure you want to delete this asset?`),
    },
  );

  const { confirm: confirmBulkDelete, confirmationDialog: bulkDeleteDialog } =
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
          msg`Are you sure you want to delete ${markedIds.size} assets?`,
        ),
      },
    );

  useEffect(() => {
    if (isOpen) {
      refresh();
      setMarkedIds(new Set());
      setQuery("");
      setIsDraggingFiles(false);
      dragDepthRef.current = 0;
      didAutoPreviewRef.current = false;
    }
  }, [isOpen, refresh]);

  // The dialog focuses its first control when it opens, which would be the
  // search box and raise the on-screen keyboard. Take focus on the panel.
  useEffect(() => {
    if (isOpen) containerRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    setSelectedAssetSrc(selectedSrc ?? "");
  }, [selectedSrc]);

  // When picking, open on the asset that is currently in use.
  useEffect(() => {
    if (!isOpen || didAutoPreviewRef.current || assets.length === 0) return;
    didAutoPreviewRef.current = true;
    const current = selectedSrc && assets.find((a) => a.src === selectedSrc);
    if (current) setPreviewAsset(current);
  }, [isOpen, assets, selectedSrc]);

  // Clear stale preview if asset was deleted externally
  useEffect(() => {
    if (previewAsset && !assets.find((a) => a.id === previewAsset.id)) {
      setPreviewAsset(null);
    }
  }, [assets, previewAsset]);

  if (!isOpen) return null;

  const handleUpload = async (files?: File[]) => {
    const srcs = await upload(files);
    if (srcs.length > 0) setQuery("");
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

  const handleThumbnailDoubleClick = (asset: DBAsset) => {
    if (!onSelect) return;
    setSelectedAssetSrc(asset.src);
    onSelect(asset.src);
  };

  const handleToggleMark = (id: string, shiftKey: boolean) => {
    if (shiftKey && lastMarkedIdRef.current) {
      // Range select: mark all assets between last marked and current
      const lastIdx = visibleAssets.findIndex(
        (a) => a.id === lastMarkedIdRef.current,
      );
      const currIdx = visibleAssets.findIndex((a) => a.id === id);
      if (lastIdx !== -1 && currIdx !== -1) {
        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        setMarkedIds((prev) => {
          const next = new Set(prev);
          for (let i = start; i <= end; i++) {
            next.add(visibleAssets[i].id);
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

  const allVisibleMarked =
    visibleAssets.length > 0 && visibleAssets.every((a) => markedIds.has(a.id));

  const toggleMarkAll = () => {
    setMarkedIds(
      allVisibleMarked ? new Set() : new Set(visibleAssets.map((a) => a.id)),
    );
  };

  // Files can be dropped anywhere on the modal. Depth-counted because
  // dragenter/dragleave also fire for every child the pointer crosses.
  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepthRef.current += 1;
      setIsDraggingFiles(true);
    },
    onDragOver: (e: React.DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDraggingFiles(false);
    },
    onDrop: (e: React.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingFiles(false);
      handleUpload(Array.from(e.dataTransfer.files));
    },
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="assets-modal-title"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className={styles.assetsModal}
        {...dropHandlers}
      >
        <header className={styles.header}>
          <h3 id="assets-modal-title" className={styles.title}>
            <Trans>Assets</Trans>
          </h3>
          <label className={styles.search}>
            <LuSearch aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder={_(msg`Search assets`)}
              aria-label={_(msg`Search assets`)}
              disabled={assets.length === 0}
            />
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            className={styles.hiddenInput}
          />
          <Button className={styles.upload} onClick={openFilePicker}>
            <FaUpload size={12} />
            <Trans>Upload</Trans>
          </Button>
          <Button
            variant="subtle"
            className={styles.close}
            onClick={onClose}
            tooltip={_(msg`Close`)}
          >
            <FaXmark size={16} />
          </Button>
        </header>

        {assets.length > 0 && (
          <div className={styles.toolbar}>
            <span className={styles.count}>
              {markedIds.size > 0 ? (
                <Trans>{markedIds.size} selected</Trans>
              ) : (
                <Trans>{visibleAssets.length} assets</Trans>
              )}
            </span>
            <div className={styles.toolbarActions}>
              {visibleAssets.length > 0 && (
                <Button variant="subtle" size="sm" onClick={toggleMarkAll}>
                  {allVisibleMarked ? (
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
                  onClick={() => confirmBulkDelete([...markedIds])}
                  className={styles.bulkDeleteButton}
                >
                  <RiDeleteBin6Fill size={12} />
                  <Trans>Delete ({markedIds.size})</Trans>
                </Button>
              )}
            </div>
          </div>
        )}

        <div className={styles.body}>
          <AssetGrid
            assets={visibleAssets}
            isFiltered={assets.length > 0}
            selectedSrc={selectedAssetSrc}
            previewAssetId={previewAsset?.id}
            markedIds={markedIds}
            onThumbnailClick={handleThumbnailClick}
            onThumbnailDoubleClick={
              onSelect ? handleThumbnailDoubleClick : undefined
            }
            onToggleMark={handleToggleMark}
            onUploadClick={openFilePicker}
          />
          <AssetPreview
            asset={previewAsset}
            isSelected={previewAsset?.src === selectedAssetSrc}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            onSelect={onSelect ? handleSelectFromPreview : undefined}
            onDelete={handleDeleteFromPreview}
            onDismiss={() => setPreviewAsset(null)}
          />
        </div>

        {isDraggingFiles && (
          <div className={styles.dropOverlay}>
            <FaUpload size={28} />
            <Trans>Drop images to upload</Trans>
          </div>
        )}
      </div>
      {confirmationDialog}
      {bulkDeleteDialog}
    </Modal>
  );
};
