import cn from "classnames";
import { FaCheck } from "react-icons/fa6";
import { FaImage } from "react-icons/fa6";
import { Trans } from "@lingui/react/macro";

import { FileUploader } from "@/components/shared/FileUploader/FileUploader";
import { DBAsset } from "@/types/Repository";

import styles from "./AssetGrid.module.scss";

type Props = {
  assets: DBAsset[];
  selectedSrc: string;
  previewAssetId?: string;
  markedIds: Set<string>;
  onThumbnailClick: (asset: DBAsset) => void;
  onThumbnailDoubleClick?: (asset: DBAsset) => void;
  onToggleMark: (id: string, shiftKey: boolean) => void;
  onUpload: (files?: File[]) => void;
};

export const AssetGrid = ({
  assets,
  selectedSrc,
  previewAssetId,
  markedIds,
  onThumbnailClick,
  onThumbnailDoubleClick,
  onToggleMark,
  onUpload,
}: Props) => {
  if (assets.length === 0) {
    return (
      <div className={styles.gridPanel}>
        <div className={styles.emptyState}>
          <FaImage size={48} />
          <span>
            <Trans>No assets yet</Trans>
          </span>
          <FileUploader onChange={onUpload} multiple />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gridPanel}>
      <div className={styles.grid}>
        {assets.map((asset) => (
          <div
            key={asset.id}
            className={cn(styles.thumbnail, {
              [styles.previewing]: asset.id === previewAssetId,
              [styles.selected]: asset.src === selectedSrc,
              [styles.marked]: markedIds.has(asset.id),
            })}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey || e.shiftKey) {
                onToggleMark(asset.id, e.shiftKey);
              } else {
                onThumbnailClick(asset);
              }
            }}
            onDoubleClick={(e) => {
              if (e.ctrlKey || e.metaKey || e.shiftKey) return;
              onThumbnailDoubleClick?.(asset);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (e.key === "Enter" && onThumbnailDoubleClick) {
                  onThumbnailDoubleClick(asset);
                } else {
                  onThumbnailClick(asset);
                }
              }
            }}
          >
            <div
              className={cn(styles.markCheckbox, {
                [styles.checked]: markedIds.has(asset.id),
              })}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMark(asset.id, e.shiftKey);
              }}
            >
              {markedIds.has(asset.id) && <FaCheck size={8} color="#fff" />}
            </div>
            <img src={asset.src} alt={asset.fileName} loading="lazy" />
            {asset.src === selectedSrc && (
              <div className={styles.checkBadge}>
                <FaCheck size={8} color="#fff" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
