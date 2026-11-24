import { Trans } from "@lingui/react/macro";
import { FaCopy, FaDownload } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmableButton } from "@/components/shared/ConfirmableButton/ConfirmableButton";
import { copyImageToClipboard } from "@/utils/social/clipboardImage";
import { usePredictionStore } from "@/store/predictionStore";
import { downloadBlob, shareMethodFor } from "@/utils/top8/downloadBlob";
import {
  logEvent,
  logWarning,
  setPerson,
  setPersonOnce,
} from "@/utils/observability/log";

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
  const tournamentUrl = usePredictionStore((s) => s.tournamentUrl);

  const exportContext = {
    export_surface: "predict" as const,
    export_format: "png" as const,
    tournament_url: tournamentUrl,
  };

  const handleDownload = async () => {
    if (!blob) return;
    const filename = `${
      normalizeFilename(tournamentName) || "predictions"
    }-predictions.png`;
    try {
      const outcome = await downloadBlob({
        blob,
        filename,
        mimeType: "image/png",
      });
      if (outcome === "cancelled") return;
      logEvent("graphic_export_complete", {
        ...exportContext,
        share_method: shareMethodFor(outcome),
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
      logWarning("predict download failed", {
        area: "predict-export",
        tournament_url: tournamentUrl,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleCopy = async () => {
    if (!blob) return false;
    const result = await copyImageToClipboard(blob);
    if (!result.ok) {
      // Clipboard write commonly fails: permission denied, insecure
      // context (HTTP), or a browser with no image clipboard.
      logEvent("graphic_export_fail", {
        ...exportContext,
        failure_kind: "post_process",
        share_method: "clipboard",
      });
      logWarning("predict clipboard write failed", {
        area: "predict-export",
        tournament_url: tournamentUrl,
        error: result.reason,
      });
      return false;
    }
    logEvent("graphic_share", {
      export_surface: "predict",
      share_method: "clipboard",
      tournament_url: tournamentUrl,
    });
    return true;
  };

  return (
    <div className={styles.root}>
      <Button onClick={handleDownload}>
        <FaDownload />
        <Trans>Download</Trans>
      </Button>
      <ConfirmableButton
        icon={<FaCopy />}
        label={<Trans>Copy</Trans>}
        confirmLabel={<Trans>Copied!</Trans>}
        failLabel={<Trans>Copy failed</Trans>}
        onAction={handleCopy}
      />
    </div>
  );
};
