import { useState } from "react";
import { FaArrowRotateLeft, FaDownload, FaEraser } from "react-icons/fa6";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal/ConfirmationModal";
import { TierListSettings } from "@/components/tierlist/TierListSettings/TierListSettings";
import { useTierListStore } from "@/store/tierListStore";
import { downloadBlob } from "@/utils/top8/downloadBlob";

import styles from "./TierListToolbar.module.scss";

type Props = {
  exportRef: React.RefObject<HTMLDivElement | null>;
};

export const TierListToolbar = ({ exportRef }: Props) => {
  const { _ } = useLingui();
  const dispatch = useTierListStore((s) => s.dispatch);

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    const { toCanvas } = await import("html-to-image");
    // Yield to let React render the loading state before the heavy work
    await new Promise((r) => requestAnimationFrame(r));
    const target = exportRef.current;

    const PIXEL_RATIO = 2;
    const WATERMARK_BAND_CSS_PX = 28;
    const WATERMARK_FONT_CSS_PX = 11;
    const WATERMARK_FONT_FAMILY = '"M PLUS Rounded 1c", sans-serif';
    const WATERMARK_FONT_WEIGHT = 500;
    const WATERMARK_LETTER_SPACING_CSS_PX = 1.5;

    try {
      // The brand font is loaded via Google Fonts globally, but it may not yet
      // be available to the canvas at the exact weight/size we need. Force it
      // to load before drawing so the text doesn't fall back to a system font.
      try {
        await document.fonts.load(
          `${WATERMARK_FONT_WEIGHT} ${WATERMARK_FONT_CSS_PX}px ${WATERMARK_FONT_FAMILY}`,
        );
      } catch {
        // Non-fatal — fallback to sans-serif if loading fails.
      }

      const sourceCanvas = await toCanvas(target, {
        backgroundColor: "transparent",
        pixelRatio: PIXEL_RATIO,
        skipFonts: true,
        filter: (node) =>
          !(
            node instanceof HTMLElement &&
            node.hasAttribute("data-export-ignore")
          ),
      });

      // The cloned snapshot omits data-export-ignore direct children, so the
      // rendered content is shorter than sourceCanvas.height (which mirrors the
      // live DOM's bounding box). Recompute the true content height to avoid
      // baking blank space (e.g. the empty title placeholder) into the export.
      const visibleChildren = Array.from(target.children).filter(
        (c): c is HTMLElement =>
          c instanceof HTMLElement && !c.hasAttribute("data-export-ignore"),
      );
      const gapCss = parseFloat(getComputedStyle(target).rowGap || "0") || 0;
      const contentCss =
        visibleChildren.reduce(
          (sum, c) => sum + c.getBoundingClientRect().height,
          0,
        ) + Math.max(0, visibleChildren.length - 1) * gapCss;
      const contentPx = Math.min(
        Math.round(contentCss * PIXEL_RATIO),
        sourceCanvas.height,
      );

      const bandPx = WATERMARK_BAND_CSS_PX * PIXEL_RATIO;
      const composed = document.createElement("canvas");
      composed.width = sourceCanvas.width;
      composed.height = contentPx + bandPx;
      const ctx = composed.getContext("2d")!;

      ctx.drawImage(
        sourceCanvas,
        0,
        0,
        sourceCanvas.width,
        contentPx,
        0,
        0,
        sourceCanvas.width,
        contentPx,
      );

      // Watermark band: matches the prediction-graphic footer aesthetic —
      // dark gradient panel, hairline border-top, M PLUS Rounded 1c text.
      const bandTop = contentPx;
      const bandBottom = bandTop + bandPx;
      const bandGradient = ctx.createLinearGradient(0, bandTop, 0, bandBottom);
      bandGradient.addColorStop(0, "#1a1a2e");
      bandGradient.addColorStop(1, "#0f0f1a");
      ctx.fillStyle = bandGradient;
      ctx.fillRect(0, bandTop, composed.width, bandPx);

      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      ctx.fillRect(0, bandTop, composed.width, Math.max(1, PIXEL_RATIO));

      ctx.fillStyle = "#5a5a72";
      ctx.font = `${WATERMARK_FONT_WEIGHT} ${WATERMARK_FONT_CSS_PX * PIXEL_RATIO}px ${WATERMARK_FONT_FAMILY}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // letterSpacing is supported in modern Chromium/Safari/Firefox.
      (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
        `${WATERMARK_LETTER_SPACING_CSS_PX * PIXEL_RATIO}px`;
      ctx.fillText(
        "smash-ranker.app",
        composed.width / 2,
        bandTop + bandPx / 2,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        composed.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
          "image/png",
        );
      });

      await downloadBlob({
        blob,
        filename: "tier-list.png",
        mimeType: "image/png",
      });
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const [confirmAction, setConfirmAction] = useState<"clear" | "reset" | null>(
    null,
  );

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
      <Button
        size="md"
        variant="outline"
        onClick={() => setConfirmAction("clear")}
      >
        <FaEraser size={14} /> <Trans>Clear</Trans>
      </Button>
      <Button
        size="md"
        variant="outline"
        onClick={() => setConfirmAction("reset")}
      >
        <FaArrowRotateLeft size={14} /> <Trans>Reset</Trans>
      </Button>
      <Button size="md" onClick={handleExport} loading={exporting}>
        <FaDownload size={14} /> <Trans>Save Image</Trans>
      </Button>

      <ConfirmationModal
        isOpen={confirmAction === "clear"}
        onClose={() => setConfirmAction(null)}
        title={_(msg`Clear Tiers`)}
        description={_(
          msg`This will move all characters back to the unranked pool. Your tiers will remain.`,
        )}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmationModal
        isOpen={confirmAction === "reset"}
        onClose={() => setConfirmAction(null)}
        title={_(msg`Reset All`)}
        description={_(
          msg`This will reset everything to the default state, including tiers and all character placements.`,
        )}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};
