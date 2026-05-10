import { Trans } from "@lingui/react/macro";
import { FaCopy, FaDownload } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmableButton } from "@/components/shared/ConfirmableButton/ConfirmableButton";
import { usePredictionStore } from "@/store/predictionStore";
import { downloadBlob } from "@/utils/top8/downloadBlob";
import { logEvent, setPerson, setPersonOnce } from "@/utils/observability/log";

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

  const handleDownload = async () => {
    if (!blob) return;
    const filename = `${
      normalizeFilename(tournamentName) || "predictions"
    }-predictions.png`;
    await downloadBlob({ blob, filename, mimeType: "image/png" });
    logEvent("graphic_export_complete", {
      export_surface: "predict",
      export_format: "png",
      share_method: "download",
    });
    const now = new Date().toISOString();
    setPersonOnce({ first_export_at: now });
    setPerson({ has_exported: true, last_export_at: now });
  };

  const handleCopy = async () => {
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    logEvent("graphic_share", {
      export_surface: "predict",
      share_method: "clipboard",
    });
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
        onAction={handleCopy}
      />
    </div>
  );
};
