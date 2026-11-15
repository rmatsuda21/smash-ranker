import { useState, useEffect, useRef } from "react";
import cn from "classnames";
import { IoMdDownload } from "react-icons/io";
import { FaChevronDown } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";

import { Button } from "@/components/shared/Button/Button";
import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import {
  PIXEL_RATIO_MIN,
  PIXEL_RATIO_STEP,
  QUALITY_MAX,
  QUALITY_MIN,
  QUALITY_STEP,
  useExportPixelRatio,
  useExportSettingsStore,
} from "@/store/exportSettingsStore";
import { Slider } from "@/components/shared/Slider/Slider";
import { useEffectiveCanvasSize } from "@/hooks/top8/useEffectiveCanvasSize";
import { Popover } from "@/components/shared/Popover/Popover";
import { RadioGroup } from "@/components/shared/RadioGroup/RadioGroup";
import { ExportPreviewModal } from "@/components/top8/CanvasDownloader/ExportPreviewModal/ExportPreviewModal";
import type { StageBlobCache } from "@/hooks/top8/useStageBlobCache";

import styles from "./CanvasDownloader.module.scss";

type Props = {
  className?: string;
  onShare: () => void;
  blobCache: StageBlobCache;
};

type ImgTypes = "png" | "jpeg" | "webp";
const fileExtensions: Record<ImgTypes, string> = {
  png: "png",
  jpeg: "jpeg",
  webp: "webp",
};

export const CanvasDownloader = ({ className, onShare, blobCache }: Props) => {
  const { _ } = useLingui();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [filename, setFilename] = useState("");
  const [imgType, setImgType] = useState<ImgTypes>("png");
  const stageRef = useCanvasStore((state) => state.stageRef);
  const tournamentName = useTournamentStore(
    (state) => state.info.tournamentName,
  );
  const { pixelRatio, setPixelRatio, maxPixelRatio } = useExportPixelRatio();
  const quality = useExportSettingsStore((s) => s.quality);
  const setQuality = useExportSettingsStore((s) => s.setQuality);
  const canvasSize = useEffectiveCanvasSize();

  // Defensive cap: the persisted value is clamped on write and rehydrate,
  // but an out-of-range ratio here means a multi-million-pixel canvas.
  const effectivePixelRatio = Math.min(pixelRatio, maxPixelRatio);

  const outputWidth = Math.round(canvasSize.width * effectivePixelRatio);
  const outputHeight = Math.round(canvasSize.height * effectivePixelRatio);
  const qualityPercent = Math.round(quality * 100);
  const qualitySupported = imgType !== "png";

  useEffect(() => {
    const normalizedFilename = tournamentName
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "");
    setFilename(normalizedFilename);
  }, [tournamentName]);

  return (
    <div ref={anchorRef} className={cn(styles.downloader, className)}>
      <Button
        className={styles.exportButton}
        disabled={!stageRef}
        onClick={() => setIsPanelOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={isPanelOpen}
      >
        <IoMdDownload size={16} />
        {_(msg`Export`)}
        <FaChevronDown
          className={cn(styles.chevron, { [styles.open]: isPanelOpen })}
          size={10}
        />
      </Button>
      <Popover
        anchorRef={anchorRef}
        open={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        placement="bottom-end"
        offset={8}
        minWidth={300}
        className={styles.panel}
      >
        <div className={styles.field}>
          <label htmlFor="downloader-filename">{_(msg`Filename`)}</label>
          <div className={styles.filename}>
            <input
              id="downloader-filename"
              name="downloader-filename"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={filename}
              onChange={(event) => {
                setFilename(event.currentTarget.value);
              }}
              placeholder="ranker"
            />
            <span className={styles.extension}>.{fileExtensions[imgType]}</span>
          </div>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{_(msg`Format`)}</span>
          <RadioGroup
            className={styles.formats}
            name="downloader-format"
            options={(Object.keys(fileExtensions) as ImgTypes[]).map((key) => ({
              value: key,
              label: key.toUpperCase(),
            }))}
            value={imgType}
            onChange={setImgType}
          />
        </div>
        <div className={styles.options}>
          <button
            type="button"
            className={styles.optionsToggle}
            onClick={() => setIsOptionsOpen((open) => !open)}
            aria-expanded={isOptionsOpen}
            aria-controls="downloader-options"
          >
            {_(msg`Download Options`)}
            <FaChevronDown
              className={cn(styles.chevron, { [styles.open]: isOptionsOpen })}
              size={10}
            />
          </button>
          {isOptionsOpen && (
            <div id="downloader-options" className={styles.optionsBody}>
              <div className={styles.field}>
                <Slider
                  label={
                    <span className={styles.sliderLabel}>
                      <Trans>Pixel Ratio</Trans>
                      <span className={styles.value}>
                        {effectivePixelRatio}×
                      </span>
                    </span>
                  }
                  min={PIXEL_RATIO_MIN}
                  max={maxPixelRatio}
                  step={PIXEL_RATIO_STEP}
                  value={effectivePixelRatio}
                  onValueChange={setPixelRatio}
                />
                <p className={styles.hint}>
                  <Trans>
                    Output: {outputWidth} × {outputHeight} px
                  </Trans>
                </p>
              </div>
              <div className={styles.field}>
                <Slider
                  label={
                    <span className={styles.sliderLabel}>
                      <Trans>Quality</Trans>
                      <span className={styles.value}>{qualityPercent}%</span>
                    </span>
                  }
                  min={QUALITY_MIN}
                  max={QUALITY_MAX}
                  step={QUALITY_STEP}
                  value={quality}
                  onValueChange={setQuality}
                  disabled={!qualitySupported}
                />
                <p className={cn(styles.hint, styles.reserveLines)}>
                  {qualitySupported ? (
                    <Trans>
                      Lower values reduce file size at the cost of detail.
                    </Trans>
                  ) : (
                    <Trans>
                      PNG is lossless, quality only applies to JPEG and WebP.
                    </Trans>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className={styles.actions}>
          <Button
            fullWidth
            onClick={() => {
              setIsPanelOpen(false);
              setIsPreviewOpen(true);
            }}
          >
            <IoMdDownload size={16} />
            {_(msg`Download`)}
          </Button>
        </div>
      </Popover>
      <ExportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onShare={onShare}
        filename={filename}
        imgType={imgType}
        pixelRatio={effectivePixelRatio}
        quality={quality}
        blobCache={blobCache}
      />
    </div>
  );
};
