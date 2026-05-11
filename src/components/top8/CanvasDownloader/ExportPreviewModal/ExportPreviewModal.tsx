import { useEffect, useState } from "react";
import { FaArrowUpFromBracket, FaCopy, FaDownload } from "react-icons/fa6";
import { Trans } from "@lingui/react/macro";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmableButton } from "@/components/shared/ConfirmableButton/ConfirmableButton";
import { Modal } from "@/components/shared/Modal/Modal";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { useCanvasStore } from "@/store/canvasStore";
import { exportCanvasToPngBlob } from "@/utils/top8/exportCanvas";
import { downloadBlob } from "@/utils/top8/downloadBlob";
import { copyImageToClipboard } from "@/utils/social/clipboardImage";
import { logEvent, setPerson, setPersonOnce } from "@/utils/observability/log";
import {
  buildStageBlobKey,
  type StageBlobCache,
} from "@/hooks/top8/useStageBlobCache";

import styles from "./ExportPreviewModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  filename: string;
  imgType: "png" | "jpeg" | "webp";
  pixelRatio: number;
  quality: number;
  blobCache: StageBlobCache;
};

type Status = "loading" | "ready" | "error";

export const ExportPreviewModal = ({
  isOpen,
  onClose,
  onShare,
  filename,
  imgType,
  pixelRatio,
  quality,
  blobCache,
}: Props) => {
  const stageRef = useCanvasStore((state) => state.stageRef);
  const mimeType = `image/${imgType}`;
  const settingsKey = buildStageBlobKey(mimeType, pixelRatio, quality);

  const [status, setStatus] = useState<Status>("loading");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (!isOpen || !stageRef) return;

    let createdUrl: string | null = null;
    const adoptBlob = (next: Blob) => {
      createdUrl = URL.createObjectURL(next);
      setBlob(next);
      setImageUrl(createdUrl);
      setStatus("ready");
    };

    const cached = blobCache.current.entry;
    if (cached?.key === settingsKey) {
      adoptBlob(cached.blob);
      return () => {
        if (createdUrl) URL.revokeObjectURL(createdUrl);
      };
    }

    let cancelled = false;
    setStatus("loading");
    setImageUrl(null);
    setBlob(null);

    const startedAt = performance.now();
    const startEpoch = blobCache.current.epoch;
    logEvent("graphic_export_start", {
      export_surface: "ranker",
      export_format: imgType,
      pixel_ratio: pixelRatio,
    });

    const generate = async () => {
      try {
        const result = await exportCanvasToPngBlob({
          stageRef,
          pixelRatio,
          mimeType,
          quality,
        });

        if (cancelled) return;

        if (!result) {
          logEvent("graphic_export_fail", {
            export_surface: "ranker",
            export_format: imgType,
            failure_kind: "blob_null",
            duration_ms: Math.round(performance.now() - startedAt),
          });
          setStatus("error");
          return;
        }

        // Only write to the shared cache if no invalidation happened
        // mid-flight — otherwise the blob no longer reflects current state.
        if (blobCache.current.epoch === startEpoch) {
          blobCache.current.entry = { key: settingsKey, blob: result };
        }
        adoptBlob(result);
      } catch {
        if (cancelled) return;
        logEvent("graphic_export_fail", {
          export_surface: "ranker",
          export_format: imgType,
          failure_kind: "render_threw",
          duration_ms: Math.round(performance.now() - startedAt),
        });
        setStatus("error");
      }
    };

    generate();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [
    isOpen,
    stageRef,
    settingsKey,
    imgType,
    pixelRatio,
    quality,
    mimeType,
    blobCache,
  ]);

  const handleDownload = async () => {
    if (!blob) return;
    const finalFilename = `${filename || "ranker"}.${imgType}`;
    await downloadBlob({ blob, filename: finalFilename, mimeType });
    logEvent("graphic_export_complete", {
      export_surface: "ranker",
      export_format: imgType,
      pixel_ratio: pixelRatio,
    });
    const now = new Date().toISOString();
    setPersonOnce({ first_export_at: now });
    setPerson({ has_exported: true, last_export_at: now });
  };

  const handleCopy = async () => {
    if (!blob) return false;
    const result = await copyImageToClipboard(blob);
    if (!result.ok) return false;
    logEvent("graphic_share", {
      export_surface: "ranker",
      share_method: "clipboard",
    });
    return true;
  };

  const handleShare = () => {
    onClose();
    onShare();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.previewArea}>
          {status === "loading" && (
            <div className={styles.placeholder}>
              <Spinner size={48} />
              <p className={styles.placeholderText}>
                <Trans>Generating preview...</Trans>
              </p>
            </div>
          )}
          {status === "error" && (
            <div className={styles.placeholder}>
              <p className={styles.errorText}>
                <Trans>Failed to generate image</Trans>
              </p>
            </div>
          )}
          {status === "ready" && imageUrl && (
            <img
              className={styles.image}
              src={imageUrl}
              alt="Graphic preview"
            />
          )}
        </div>
        <div className={styles.actions}>
          <Button
            variant="solid"
            onClick={handleDownload}
            disabled={status !== "ready"}
          >
            <FaDownload />
            <Trans>Download</Trans>
          </Button>
          <ConfirmableButton
            icon={<FaCopy />}
            label={<Trans>Copy</Trans>}
            confirmLabel={<Trans>Copied!</Trans>}
            failLabel={<Trans>Copy failed</Trans>}
            onAction={handleCopy}
            disabled={status !== "ready"}
          />
          <Button
            variant="outline"
            onClick={handleShare}
            disabled={status !== "ready"}
          >
            <FaArrowUpFromBracket />
            <Trans>Share</Trans>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
