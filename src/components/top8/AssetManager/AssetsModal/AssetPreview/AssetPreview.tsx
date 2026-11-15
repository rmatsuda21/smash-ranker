import { useEffect, useRef, useState } from "react";
import cn from "classnames";
import { FaMinus, FaPlus, FaImage, FaCheck, FaXmark } from "react-icons/fa6";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { Slider } from "@/components/shared/Slider/Slider";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { useBlobUrl } from "@/hooks/useBlobUrl";
import { DBAsset } from "@/types/Repository";

import { useImageMeta } from "@/hooks/top8/useImageMeta";
import styles from "./AssetPreview.module.scss";

type Props = {
  asset: DBAsset | null;
  isSelected: boolean;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  onSelect?: () => void;
  onDelete: () => void;
  onDismiss: () => void;
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
  onDismiss,
}: Props) => {
  const { _, i18n } = useLingui();
  const meta = useImageMeta(asset?.data ?? null);
  const url = useBlobUrl(asset?.data);
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
      1, // don't upscale small images
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
      <div className={cn(styles.previewPanel, styles.isEmpty)}>
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

  const typeLabel = (asset.data.type.split("/")[1] ?? asset.data.type)
    .replace("+xml", "")
    .toUpperCase();
  const dimensions = meta ? `${meta.width} × ${meta.height}` : null;

  return (
    <div className={styles.previewPanel}>
      <div className={styles.desktopLayout}>
        <div className={styles.imageContainer} ref={containerRef}>
          <div className={styles.imageWrapper}>
            {url && (
              <img
                src={url}
                alt={asset.fileName}
                style={{
                  width: displayWidth ? `${displayWidth}px` : undefined,
                  height: displayHeight ? `${displayHeight}px` : undefined,
                }}
              />
            )}
          </div>
        </div>

        <div className={styles.zoomControls}>
          <Button
            variant="subtle"
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
            variant="subtle"
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
        {url && <img src={url} alt={asset.fileName} />}
      </div>

      <div className={styles.info}>
        <p className={styles.fileName} title={asset.fileName}>
          {asset.fileName}
        </p>
        {/* One line on phones, the full table on desktop. */}
        <p className={styles.metaLine}>
          {[typeLabel, formatBytes(asset.data.size), dimensions]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <dl className={styles.details}>
          <div className={styles.detailRow}>
            <dt>
              <Trans>Type</Trans>
            </dt>
            <dd>{typeLabel}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>
              <Trans>Size</Trans>
            </dt>
            <dd>{formatBytes(asset.data.size)}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>
              <Trans>Dimensions</Trans>
            </dt>
            <dd>{dimensions ?? <Spinner size={12} />}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>
              <Trans>Uploaded</Trans>
            </dt>
            <dd>{formatDate(asset.date, i18n.locale)}</dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        className={styles.dismiss}
        onClick={onDismiss}
        aria-label={_(msg`Close`)}
      >
        <FaXmark size={14} />
      </button>

      <div className={styles.actions}>
        {onSelect && (
          <Button
            className={styles.selectButton}
            onClick={onSelect}
            disabled={isSelected}
          >
            {isSelected ? (
              <>
                <FaCheck size={12} />
                <Trans>Selected</Trans>
              </>
            ) : (
              <Trans>Use this image</Trans>
            )}
          </Button>
        )}
        <Button
          variant="outline"
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
