import { useState } from "react";
import { Trans } from "@lingui/react/macro";
import { FaDownload, FaCopy, FaCircleCheck } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { usePredictionStore } from "@/store/predictionStore";
import { downloadBlob } from "@/utils/top8/downloadBlob";

import styles from "./ExportBar.module.scss";

const normalizeFilename = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

type Props = {
  blob: Blob | null;
};

export const ExportBar = ({ blob }: Props) => {
  const tournamentName = usePredictionStore((s) => s.tournamentName);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    if (!blob) return;

    const filename = `${normalizeFilename(tournamentName) || "predictions"}-predictions.png`;
    await downloadBlob({ blob, filename, mimeType: "image/png" });
  };

  const handleCopy = async () => {
    if (!blob) return;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  };

  return (
    <div className={styles.root}>
      <Button onClick={handleDownload}>
        <FaDownload />
        <Trans>Download</Trans>
      </Button>
      <Button
        variant="outline"
        onClick={handleCopy}
        className={copied ? styles.copied : undefined}
      >
        <span className={styles.copyLabel}>
          <span className={`${styles.copyInner} ${copied ? styles.hidden : ""}`}>
            <FaCopy />
            <Trans>Copy</Trans>
          </span>
          {copied && (
            <span className={styles.copiedOverlay}>
              <FaCircleCheck />
              <Trans>Copied!</Trans>
            </span>
          )}
        </span>
      </Button>
    </div>
  );
};
