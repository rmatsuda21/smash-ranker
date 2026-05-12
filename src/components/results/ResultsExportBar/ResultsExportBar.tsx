import { Trans } from "@lingui/react/macro";
import { FaCopy, FaDownload } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmableButton } from "@/components/shared/ConfirmableButton/ConfirmableButton";
import { useResultsStore } from "@/store/resultsStore";
import { downloadBlob } from "@/utils/top8/downloadBlob";
import {
  logEvent,
  logWarning,
  setPerson,
  setPersonOnce,
} from "@/utils/observability/log";

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
  const tournamentUrl = useResultsStore((s) => s.tournamentUrl);
  const videogameId = useResultsStore((s) => s.videogameId);
  const playerName = useResultsStore((s) => s.playerResults?.name ?? "");
  const entrantId = useResultsStore((s) => s.playerResults?.entrantId ?? null);
  const playerId = useResultsStore((s) => s.playerResults?.playerId ?? null);
  const setCount = useResultsStore((s) => s.playerResults?.sets.length ?? 0);

  // Shared context: every export event carries the tournament + entrant
  // identifiers so failures can be reproduced and start.gg upstream
  // issues can be filed with the exact URL + ids.
  const exportContext = {
    export_surface: "results" as const,
    export_format: "png" as const,
    tournament_url: tournamentUrl,
    videogame_id: videogameId,
    entrant_id: entrantId,
    player_id: playerId,
    set_count: setCount,
  };

  const handleDownload = async () => {
    if (!blob) return;
    const tournament = normalizeFilename(tournamentName) || "tournament";
    const player = normalizeFilename(playerName) || "player";
    const filename = `${tournament}-${player}-results.png`;
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
      // Most likely the user denied the download permission prompt — still
      // worth tracking so the funnel reflects real outcomes.
      logEvent("graphic_export_fail", {
        ...exportContext,
        failure_kind: "post_process",
        share_method: "download",
      });
      logWarning("results download failed", {
        area: "results-export",
        tournament_url: tournamentUrl,
        entrant_id: entrantId,
        player_id: playerId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleCopy = async () => {
    if (!blob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      logEvent("graphic_share", {
        export_surface: "results",
        share_method: "clipboard",
        tournament_url: tournamentUrl,
        entrant_id: entrantId,
        player_id: playerId,
      });
    } catch (err) {
      // Clipboard write commonly fails: permission denied, insecure
      // context (HTTP), or the user navigated away mid-promise.
      logEvent("graphic_export_fail", {
        ...exportContext,
        failure_kind: "post_process",
        share_method: "clipboard",
      });
      logWarning("results clipboard write failed", {
        area: "results-export",
        tournament_url: tournamentUrl,
        entrant_id: entrantId,
        player_id: playerId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
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
