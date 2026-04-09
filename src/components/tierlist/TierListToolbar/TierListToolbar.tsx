import { useState } from "react";
import {
  FaArrowRotateLeft,
  FaDownload,
  FaEraser,
} from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal/ConfirmationModal";
import { TierListSettings } from "@/components/tierlist/TierListSettings/TierListSettings";
import { useTierListStore } from "@/store/tierListStore";

import styles from "./TierListToolbar.module.scss";

type Props = {
  exportRef: React.RefObject<HTMLDivElement | null>;
};

export const TierListToolbar = ({ exportRef }: Props) => {
  const dispatch = useTierListStore((s) => s.dispatch);

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    const { toPng } = await import("html-to-image");
    // Yield to let React render the loading state before the heavy work
    await new Promise((r) => requestAnimationFrame(r));
    try {
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: "#1a1a2e",
        pixelRatio: 2,
        filter: (node) =>
          !(node instanceof HTMLElement && node.hasAttribute("data-export-ignore")),
      });
      const link = document.createElement("a");
      link.download = "tier-list.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const [confirmAction, setConfirmAction] = useState<"clear" | "reset" | null>(null);

  const handleConfirm = () => {
    if (confirmAction === "clear") {
      dispatch({ type: "CLEAR_TIERS" });
    } else if (confirmAction === "reset") {
      dispatch({ type: "RESET_ALL" });
    }
    setConfirmAction(null);
  };

  return (
    <div className={styles.toolbar}>
      <TierListSettings />
      <Button size="md" variant="outline" onClick={() => setConfirmAction("clear")}>
        <FaEraser size={14} /> Clear
      </Button>
      <Button size="md" variant="outline" onClick={() => setConfirmAction("reset")}>
        <FaArrowRotateLeft size={14} /> Reset
      </Button>
      <Button size="md" onClick={handleExport} loading={exporting}>
        <FaDownload size={14} /> Export PNG
      </Button>

      <ConfirmationModal
        isOpen={confirmAction === "clear"}
        onClose={() => setConfirmAction(null)}
        title="Clear Tiers"
        description="This will move all characters back to the unranked pool. Your tiers will remain."
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmationModal
        isOpen={confirmAction === "reset"}
        onClose={() => setConfirmAction(null)}
        title="Reset All"
        description="This will reset everything to the default state, including tiers and all character placements."
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};
