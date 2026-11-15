import cn from "classnames";
import { FaCheck, FaImage, FaUpload } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { AssetThumb } from "@/components/top8/AssetManager/AssetThumb/AssetThumb";
import { DBAsset } from "@/types/Repository";

import styles from "./AssetGrid.module.scss";

type Props = {
  assets: DBAsset[];
  /** True when `assets` is a search result rather than the whole library. */
  isFiltered: boolean;
  selectedSrc: string;
  previewAssetId?: string;
  markedIds: Set<string>;
  onThumbnailClick: (asset: DBAsset) => void;
  onThumbnailDoubleClick?: (asset: DBAsset) => void;
  onToggleMark: (id: string, shiftKey: boolean) => void;
  onUploadClick: () => void;
};

export const AssetGrid = ({
  assets,
  isFiltered,
  selectedSrc,
  previewAssetId,
  markedIds,
  onThumbnailClick,
  onThumbnailDoubleClick,
  onToggleMark,
  onUploadClick,
}: Props) => {
  const { _ } = useLingui();

  if (assets.length === 0) {
    return (
      <div className={cn(styles.gridPanel, styles.empty)}>
        <FaImage size={40} />
        {isFiltered ? (
          <p className={styles.emptyTitle}>
            <Trans>No assets match your search</Trans>
          </p>
        ) : (
          <>
            <p className={styles.emptyTitle}>
              <Trans>No assets yet</Trans>
            </p>
            <p className={styles.emptyHint}>
              <Trans>Drop images here, or upload them. Up to 2MB each.</Trans>
            </p>
            <Button onClick={onUploadClick}>
              <FaUpload size={12} />
              <Trans>Upload</Trans>
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={styles.gridPanel}>
      <div className={styles.grid}>
        {assets.map((asset) => {
          const isMarked = markedIds.has(asset.id);
          return (
            <div
              key={asset.id}
              className={cn(styles.tile, {
                [styles.previewing]: asset.id === previewAssetId,
                [styles.selected]: asset.src === selectedSrc,
                [styles.marked]: isMarked,
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
              aria-pressed={asset.id === previewAssetId}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
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
              <AssetThumb asset={asset} className={styles.thumb} />
              <span className={styles.name} title={asset.fileName}>
                {asset.fileName}
              </span>
              <button
                type="button"
                className={cn(styles.markCheckbox, {
                  [styles.checked]: isMarked,
                })}
                role="checkbox"
                aria-checked={isMarked}
                aria-label={_(msg`Select ${asset.fileName}`)}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMark(asset.id, e.shiftKey);
                }}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                {isMarked && <FaCheck size={10} />}
              </button>
              {asset.src === selectedSrc && (
                <span className={styles.inUseBadge}>
                  <FaCheck size={8} />
                  <Trans>In use</Trans>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
