import { useEffect, useState } from "react";
import { FaCopy, FaDownload } from "react-icons/fa6";
import { Plural, Trans, useLingui } from "@lingui/react/macro";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmableButton } from "@/components/shared/ConfirmableButton/ConfirmableButton";
import { Modal } from "@/components/shared/Modal/Modal";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { copyImageToClipboard } from "@/utils/social/clipboardImage";
import {
  logError,
  logEvent,
  logWarning,
  setPerson,
  setPersonOnce,
} from "@/utils/observability/log";
import type { ThumbnailScene } from "@/utils/thumbnail/painter";
import {
  renderThumbnail,
  thumbnailFilename,
} from "@/utils/thumbnail/renderThumbnail";
import { downloadBlob, shareMethodFor } from "@/utils/top8/downloadBlob";
import { createZip } from "@/utils/zip";

import styles from "./ThumbnailExportModal.module.scss";

type Props = {
  // The thumbnails to save; null keeps the modal closed.
  scenes: ThumbnailScene[] | null;
  // Name of the zip when there is more than one.
  zipName: string;
  onClose: () => void;
};

type Rendered = { name: string; blob: Blob; url: string };

// What the buttons save: the one image, or a zip of them all. It is made
// before the buttons are enabled, because a phone opens its share sheet
// only straight from the tap.
type Output = { blob: Blob; filename: string; mimeType: string };

const exportContext = {
  export_surface: "thumbnail" as const,
  export_format: "png" as const,
};

// Two sets between the same players in the same round would overwrite each
// other in the zip.
const uniqueName = (name: string, taken: Set<string>): string => {
  let candidate = name;
  for (let n = 2; taken.has(candidate); n++) {
    candidate = name.replace(/\.png$/, `-${n}.png`);
  }
  taken.add(candidate);
  return candidate;
};

const ExportBody = ({
  scenes,
  zipName,
}: {
  scenes: ThumbnailScene[];
  zipName: string;
}) => {
  const { t } = useLingui();
  const [images, setImages] = useState<Rendered[]>([]);
  const [output, setOutput] = useState<Output | null>(null);
  const [failed, setFailed] = useState(false);
  const many = scenes.length > 1;

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    const startedAt = performance.now();
    logEvent("graphic_export_start", {
      ...exportContext,
      image_count: scenes.length,
    });

    const generate = async () => {
      // Let the modal and its spinner reach the screen first.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => setTimeout(resolve, 0)),
      );
      try {
        const done: Rendered[] = [];
        const taken = new Set<string>();
        for (const scene of scenes) {
          const blob = await renderThumbnail(scene);
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          urls.push(url);
          done.push({
            name: uniqueName(thumbnailFilename(scene.match), taken),
            blob,
            url,
          });
          setImages([...done]);
        }
        const result: Output =
          done.length === 1
            ? {
                blob: done[0].blob,
                filename: done[0].name,
                mimeType: "image/png",
              }
            : {
                blob: await createZip(done),
                filename: zipName,
                mimeType: "application/zip",
              };
        if (!cancelled) setOutput(result);
      } catch (err) {
        if (cancelled) return;
        logError(err, { area: "export", surface: "thumbnail" });
        logEvent("graphic_export_fail", {
          ...exportContext,
          failure_kind: "render_threw",
          duration_ms: Math.round(performance.now() - startedAt),
        });
        setFailed(true);
      }
    };
    generate();

    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [scenes, zipName]);

  const handleDownload = async () => {
    if (!output) return;
    try {
      const outcome = await downloadBlob(output);
      if (outcome === "cancelled") return;
      logEvent("graphic_export_complete", {
        ...exportContext,
        share_method: shareMethodFor(outcome),
        size_kb: Math.round(output.blob.size / 1024),
        image_count: scenes.length,
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
      logWarning("thumbnail download failed", {
        area: "thumbnail-export",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleCopy = async () => {
    if (!output) return false;
    const result = await copyImageToClipboard(output.blob);
    if (!result.ok) {
      logEvent("graphic_export_fail", {
        ...exportContext,
        failure_kind: "post_process",
        share_method: "clipboard",
      });
      return false;
    }
    logEvent("graphic_share", {
      export_surface: "thumbnail",
      share_method: "clipboard",
    });
    return true;
  };

  return (
    <div className={styles.container}>
      <div className={styles.previewArea}>
        {failed ? (
          <div className={styles.placeholder}>
            <p className={styles.note}>
              <Trans>Failed to generate image</Trans>
            </p>
          </div>
        ) : many ? (
          <div className={styles.grid}>
            {images.map((image) => (
              <img key={image.url} src={image.url} alt={image.name} />
            ))}
            {!output && (
              <div className={styles.pending}>
                <Spinner size={28} />
              </div>
            )}
          </div>
        ) : images[0] ? (
          <img
            className={styles.image}
            src={images[0].url}
            alt={t`Thumbnail preview`}
          />
        ) : (
          <div className={styles.placeholder}>
            <Spinner size={48} />
            <p className={styles.note}>
              <Trans>Generating preview...</Trans>
            </p>
          </div>
        )}
      </div>

      {many && !failed && (
        <p className={styles.note} aria-live="polite">
          {output ? (
            <Plural
              value={scenes.length}
              one="# image ready, in one zip file."
              other="# images ready, in one zip file."
            />
          ) : (
            <Trans>
              Drawing {images.length + 1} of {scenes.length}...
            </Trans>
          )}
        </p>
      )}

      <div className={styles.actions}>
        <Button variant="solid" onClick={handleDownload} disabled={!output}>
          <FaDownload />
          {many ? <Trans>Download all</Trans> : <Trans>Download</Trans>}
        </Button>
        {!many && (
          <ConfirmableButton
            icon={<FaCopy />}
            label={<Trans>Copy</Trans>}
            confirmLabel={<Trans>Copied!</Trans>}
            failLabel={<Trans>Copy failed</Trans>}
            onAction={handleCopy}
            disabled={!output}
          />
        )}
      </div>
    </div>
  );
};

// Draws the thumbnails once the modal is open, then offers them.
export const ThumbnailExportModal = ({ scenes, zipName, onClose }: Props) => {
  const { t } = useLingui();
  return (
    <Modal isOpen={scenes !== null} onClose={onClose} aria-label={t`Preview`}>
      {scenes && <ExportBody scenes={scenes} zipName={zipName} />}
    </Modal>
  );
};
