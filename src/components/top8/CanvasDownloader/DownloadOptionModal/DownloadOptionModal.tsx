import { Trans } from "@lingui/react/macro";

import { Button } from "@/components/shared/Button/Button";
import { Modal } from "@/components/shared/Modal/Modal";
import { Slider } from "@/components/shared/Slider/Slider";
import { useEffectiveCanvasSize } from "@/hooks/top8/useEffectiveCanvasSize";
import {
  PIXEL_RATIO_MAX,
  PIXEL_RATIO_MAX_MOBILE,
  PIXEL_RATIO_MIN,
  PIXEL_RATIO_STEP,
  QUALITY_MAX,
  QUALITY_MIN,
  QUALITY_STEP,
  useExportSettingsStore,
} from "@/store/exportSettingsStore";
import { isMobile } from "@/utils/isMobile";

import styles from "./DownloadOptionModal.module.scss";

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  imgType: "png" | "jpeg" | "webp";
};

export const DownloadOptionModal = ({ isOpen, setIsOpen, imgType }: Props) => {
  const pixelRatio = useExportSettingsStore((s) => s.pixelRatio);
  const quality = useExportSettingsStore((s) => s.quality);
  const setPixelRatio = useExportSettingsStore((s) => s.setPixelRatio);
  const setQuality = useExportSettingsStore((s) => s.setQuality);

  const canvasSize = useEffectiveCanvasSize();
  const maxPixelRatio = isMobile() ? PIXEL_RATIO_MAX_MOBILE : PIXEL_RATIO_MAX;
  const effectivePixelRatio = Math.min(pixelRatio, maxPixelRatio);

  const outputWidth = Math.round(canvasSize.width * effectivePixelRatio);
  const outputHeight = Math.round(canvasSize.height * effectivePixelRatio);
  const qualityPercent = Math.round(quality * 100);
  const qualitySupported = imgType !== "png";

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <div className={styles.modal}>
        <h3>
          <Trans>Download Options</Trans>
        </h3>

        <div className={styles.field}>
          <Slider
            label={
              <span className={styles.sliderLabel}>
                <Trans>Pixel Ratio</Trans>
                <span className={styles.value}>{effectivePixelRatio}×</span>
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
          <p className={styles.hint}>
            {qualitySupported ? (
              <Trans>
                Lower values reduce file size at the cost of detail.
              </Trans>
            ) : (
              <Trans>
                PNG is lossless — quality only applies to JPEG and WebP.
              </Trans>
            )}
          </p>
        </div>

        <Button onClick={() => setIsOpen(false)}>
          <Trans>Done</Trans>
        </Button>
      </div>
    </Modal>
  );
};
