import { useEffect, useRef, useState } from "react";
import { FaMinus, FaPlus, FaImage, FaCheck } from "react-icons/fa6";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { Slider } from "@/components/shared/Slider/Slider";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { DBAsset } from "@/types/Repository";

import { useImageMeta } from "../useImageMeta";
import styles from "./AssetPreview.module.scss";

type Props = {
  asset: DBAsset | null;
  isSelected: boolean;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  onSelect?: () => void;
  onDelete: () => void;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date: Date, locale: string): string => {
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const AssetPreview = ({
  asset,
  isSelected,
  zoomLevel,
  onZoomChange,
  onSelect,
  onDelete,
}: Props) => {
  const { _, i18n } = useLingui();
  const meta = useImageMeta(asset?.data ?? null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  // Calculate fit scale when meta or container size changes
  useEffect(() => {
    if (!meta || !containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;
    const scale = Math.min(
      clientWidth / meta.width,
      clientHeight / meta.height,
      1 // don't upscale small images
    );
    setFitScale(scale);
  }, [meta]);

  // Reset scroll position when asset changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      containerRef.current.scrollLeft = 0;
    }
  }, [asset?.id]);

  if (!asset) {
    return (
      <div className={styles.previewPanel}>
        <div className={styles.emptyPreview}>
          <FaImage size={48} />
          <span>
            <Trans>Select an asset to preview</Trans>
          </span>
        </div>
      </div>
    );
  }

  const handleZoomIn = () => {
    onZoomChange(Math.min(400, zoomLevel + 25));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(25, zoomLevel - 25));
  };

  // 100% zoom = image fully contained in the container
  const displayWidth = meta
    ? Math.round(meta.width * fitScale * (zoomLevel / 100))
    : undefined;
  const displayHeight = meta
    ? Math.round(meta.height * fitScale * (zoomLevel / 100))
    : undefined;

  return (
    <div className={styles.previewPanel}>
      <div className={styles.desktopLayout}>
        <div className={styles.imageContainer} ref={containerRef}>
          <div className={styles.imageWrapper}>
            <img
              src={asset.src}
              alt={asset.fileName}
              style={{
                width: displayWidth ? `${displayWidth}px` : undefined,
                height: displayHeight ? `${displayHeight}px` : undefined,
              }}
            />
          </div>
        </div>

        <div className={styles.zoomControls}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 25}
            tooltip={_(msg`Zoom Out`)}
          >
            <FaMinus size={10} />
          </Button>
          <Slider
            size="sm"
            min={25}
            max={400}
            step={25}
            value={zoomLevel}
            onValueChange={onZoomChange}
            className={styles.zoomSlider}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 400}
            tooltip={_(msg`Zoom In`)}
          >
            <FaPlus size={10} />
          </Button>
          <span className={styles.zoomLabel}>{zoomLevel}%</span>
        </div>
      </div>

      <div className={styles.mobileImageContainer}>
        <img src={asset.src} alt={asset.fileName} />
      </div>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>
            <Trans>Filename</Trans>
          </span>
          <span className={styles.detailValue}>{asset.fileName}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>
            <Trans>Type</Trans>
          </span>
          <span className={styles.detailValue}>{asset.data.type}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>
            <Trans>Size</Trans>
          </span>
          <span className={styles.detailValue}>
            {formatBytes(asset.data.size)}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>
            <Trans>Dimensions</Trans>
          </span>
          <span className={styles.detailValue}>
            {meta ? (
              `${meta.width} x ${meta.height}`
            ) : (
              <Spinner size={12} />
            )}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>
            <Trans>Uploaded</Trans>
          </span>
          <span className={styles.detailValue}>
            {formatDate(asset.date, i18n.locale)}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        {onSelect && (
          <Button
            variant="solid"
            size="sm"
            onClick={onSelect}
            disabled={isSelected}
          >
            {isSelected ? (
              <>
                <FaCheck size={12} />
                <Trans>Selected</Trans>
              </>
            ) : (
              <Trans>Select</Trans>
            )}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className={styles.deleteButton}
        >
          <RiDeleteBin6Fill size={12} />
          <Trans>Delete</Trans>
        </Button>
      </div>
    </div>
  );
};
