import { useEffect, useState } from "react";
import { FaCopy, FaDownload } from "react-icons/fa6";
import { Trans, useLingui } from "@lingui/react/macro";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmableButton } from "@/components/shared/ConfirmableButton/ConfirmableButton";
import { Modal } from "@/components/shared/Modal/Modal";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { useTierListStore } from "@/store/tierListStore";
import { copyImageToClipboard } from "@/utils/social/clipboardImage";
import { renderTierListImage } from "@/utils/tierlist/renderTierListImage";
import { downloadBlob } from "@/utils/top8/downloadBlob";
import {
  logError,
  logEvent,
  logWarning,
  setPerson,
  setPersonOnce,
} from "@/utils/observability/log";

import styles from "./TierExportModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  exportRef: React.RefObject<HTMLDivElement | null>;
};

type Status = "loading" | "ready" | "error";

const normalizeFilename = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

const exportContext = {
  export_surface: "tier" as const,
  export_format: "png" as const,
};

export const TierExportModal = ({ isOpen, onClose, exportRef }: Props) => {
  const { t } = useLingui();
  const title = useTierListStore((s) => s.title);

  const [status, setStatus] = useState<Status>("loading");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  // The list cannot change while the modal covers it, so one render per
  // opening is always current.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    let createdUrl: string | null = null;
    setStatus("loading");
    setImageUrl(null);
    setBlob(null);

    const startedAt = performance.now();
    logEvent("graphic_export_start", exportContext);

    const generate = async () => {
      // Let the modal and its spinner reach the screen before the heavy,
      // synchronous canvas work. A lone requestAnimationFrame isn't enough:
      // its callback runs *before* that frame is painted, so continuing from
      // it blocks the very paint we're waiting for. The timeout queued inside
      // the callback runs after the frame has been presented.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => setTimeout(resolve, 0)),
      );
      if (cancelled) return;

      try {
        const target = exportRef.current;
        if (!target) throw new Error("tier list element is not mounted");
        const result = await renderTierListImage(target);
        if (cancelled) return;
        createdUrl = URL.createObjectURL(result);
        setBlob(result);
        setImageUrl(createdUrl);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        // Canvas rendering / compositing failures are real bugs — keep
        // Sentry capture, plus a product fail event for rate visibility.
        logError(err, { area: "export", surface: "tier" });
        logEvent("graphic_export_fail", {
          ...exportContext,
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
  }, [isOpen, exportRef]);

  const handleDownload = async () => {
    if (!blob) return;
    const filename = `${normalizeFilename(title) || "tier-list"}.png`;
    try {
      await downloadBlob({ blob, filename, mimeType: "image/png" });
      logEvent("graphic_export_complete", {
        ...exportContext,
        share_method: "download",
        size_kb: Math.round(blob.size / 1024),
      });
      const now = new Date().toISOString();
      setPersonOnce({ first_export_at: now });
      setPerson({ has_exported: true, last_export_at: now });
    } catch (err) {
      logEvent("graphic_export_fail", {
        ...exportContext,
        failure_kind: "post_process",
        share_method: "download",
      });
      logWarning("tier list download failed", {
        area: "tier-export",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleCopy = async () => {
    if (!blob) return false;
    const result = await copyImageToClipboard(blob);
    if (!result.ok) {
      logEvent("graphic_export_fail", {
        ...exportContext,
        failure_kind: "post_process",
        share_method: "clipboard",
      });
      return false;
    }
    logEvent("graphic_share", {
      export_surface: "tier",
      share_method: "clipboard",
    });
    return true;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-label={t`Preview`}>
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
              alt={t`Tier list preview`}
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
        </div>
      </div>
    </Modal>
  );
};
