import { useState } from "react";
import { Trans } from "@lingui/react/macro";
import { FaDownload, FaCopy } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { usePredictionStore } from "@/store/predictionStore";
import { downloadBlob } from "@/utils/top8/downloadBlob";
import { PREDICTION_GRAPHIC_ID } from "@/components/predict/PredictionGraphic/PredictionGraphic";

import styles from "./ExportBar.module.scss";

const normalizeFilename = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

export const ExportBar = () => {
  const tournamentName = usePredictionStore((s) => s.tournamentName);
  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const getGraphicElement = () =>
    document.getElementById(PREDICTION_GRAPHIC_ID);

  const handleDownload = async () => {
    const target = getGraphicElement();
    if (!target) return;

    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      await new Promise((r) => requestAnimationFrame(r));

      const dataUrl = await toPng(target, {
        backgroundColor: "#1a1a2e",
        pixelRatio: 2,
        skipFonts: true,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const filename = `${normalizeFilename(tournamentName) || "predictions"}-predictions.png`;

      await downloadBlob({ blob, filename, mimeType: "image/png" });
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = async () => {
    const target = getGraphicElement();
    if (!target) return;

    setCopying(true);
    try {
      const { toBlob } = await import("html-to-image");
      await new Promise((r) => requestAnimationFrame(r));

      const blob = await toBlob(target, {
        backgroundColor: "#1a1a2e",
        pixelRatio: 2,
        skipFonts: true,
      });

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Clipboard API may not be available
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className={styles.root}>
      <Button loading={exporting} onClick={handleDownload}>
        <FaDownload />
        <Trans>Download PNG</Trans>
      </Button>
      <Button variant="outline" loading={copying} onClick={handleCopy}>
        <FaCopy />
        <span className={styles.copyLabel}>
          <span className={copied ? styles.hidden : undefined}>
            <Trans>Copy to Clipboard</Trans>
          </span>
          {copied && (
            <span className={styles.copiedOverlay}>
              <Trans>Copied!</Trans>
            </span>
          )}
        </span>
      </Button>
    </div>
  );
};
