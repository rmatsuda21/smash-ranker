import { Trans } from "@lingui/react/macro";
import { FaCopy, FaDownload } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmableButton } from "@/components/shared/ConfirmableButton/ConfirmableButton";
import { useResultsStore } from "@/store/resultsStore";
import { downloadBlob } from "@/utils/top8/downloadBlob";
import { logEvent, setPerson, setPersonOnce } from "@/utils/observability/log";

import styles from "./ResultsExportBar.module.scss";

const normalizeFilename = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

type Props = {
  blob: Blob | null;
};

export const ResultsExportBar = ({ blob }: Props) => {
  const tournamentName = useResultsStore((s) => s.tournamentName);
  const playerName = useResultsStore((s) => s.playerResults?.name ?? "");
  const setCount = useResultsStore((s) => s.playerResults?.sets.length ?? 0);

  const handleDownload = async () => {
    if (!blob) return;
    const tournament = normalizeFilename(tournamentName) || "tournament";
    const player = normalizeFilename(playerName) || "player";
    const filename = `${tournament}-${player}-results.png`;
    await downloadBlob({ blob, filename, mimeType: "image/png" });
    logEvent("graphic_export_complete", {
      export_surface: "results",
      export_format: "png",
      share_method: "download",
      set_count: setCount,
      size_kb: Math.round(blob.size / 1024),
    });
    const now = new Date().toISOString();
    setPersonOnce({ first_export_at: now });
    setPerson({ has_exported: true, last_export_at: now });
  };

  const handleCopy = async () => {
    if (!blob) return;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    logEvent("graphic_share", {
      export_surface: "results",
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
