import { useState } from "react";
import {
  FaArrowRotateLeft,
  FaDownload,
  FaRightFromBracket,
} from "react-icons/fa6";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal/ConfirmationModal";
import { TierDesignBar } from "@/components/tierlist/TierDesignBar/TierDesignBar";
import { useTierListStore } from "@/store/tierListStore";
import { downloadBlob } from "@/utils/top8/downloadBlob";
import { renderElementToCanvas } from "@/utils/tierlist/renderElementToCanvas";
import {
  logError,
  logEvent,
  setPerson,
  setPersonOnce,
} from "@/utils/observability/log";

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
    const startedAt = performance.now();
    logEvent("graphic_export_start", { export_surface: "tier" });
    // Let the loading state actually reach the screen before the heavy,
    // synchronous canvas work. A lone requestAnimationFrame isn't enough:
    // its callback runs *before* that frame is painted, so continuing from
    // it blocks the very paint we're waiting for. The timeout queued inside
    // the callback runs after the frame has been presented.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => setTimeout(resolve, 0)),
    );
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

      // Painted straight from the live layout (see renderElementToCanvas).
      // The canvas is already cropped to the non-ignored content, so an
      // empty-title placeholder doesn't leave a blank band.
      const sourceCanvas = await renderElementToCanvas(target, {
        scale: PIXEL_RATIO,
        ignore: (el) => el.hasAttribute("data-export-ignore"),
      });
      const contentPx = sourceCanvas.height;

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
      (
        ctx as CanvasRenderingContext2D & { letterSpacing?: string }
      ).letterSpacing = `${WATERMARK_LETTER_SPACING_CSS_PX * PIXEL_RATIO}px`;
      ctx.fillText(
        "smash-ranker.app",
        composed.width / 2,
        bandTop + bandPx / 2,
      );

      // Free the intermediate canvas before encoding the composed one.
      sourceCanvas.width = 0;
      sourceCanvas.height = 0;

      const blob = await new Promise<Blob>((resolve, reject) => {
        composed.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
          "image/png",
        );
      });

      composed.width = 0;
      composed.height = 0;

      await downloadBlob({
        blob,
        filename: "tier-list.png",
        mimeType: "image/png",
      });
      logEvent("graphic_export_complete", {
        export_surface: "tier",
        export_format: "png",
        duration_ms: Math.round(performance.now() - startedAt),
      });
      const now = new Date().toISOString();
      setPersonOnce({ first_export_at: now });
      setPerson({ has_exported: true, last_export_at: now });
    } catch (err) {
      // Canvas rendering / compositing failures are real bugs — keep
      // Sentry capture, plus a product fail event for rate visibility.
      logError(err, { area: "export", surface: "tier" });
      logEvent("graphic_export_fail", {
        export_surface: "tier",
        failure_kind: "render_threw",
        duration_ms: Math.round(performance.now() - startedAt),
      });
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
    <header className={styles.header}>
      <div className={styles.group}>
        <Button
          variant="subtle"
          className={styles.button}
          onClick={() => setConfirmAction("clear")}
        >
          <FaRightFromBracket size={14} /> <Trans>Unrank all</Trans>
        </Button>
        <Button
          variant="subtle"
          className={styles.button}
          onClick={() => setConfirmAction("reset")}
        >
          <FaArrowRotateLeft size={14} /> <Trans>Start over</Trans>
        </Button>
      </div>
      <TierDesignBar className={styles.designBar} />
      <div className={cn(styles.group, styles.export)}>
        <Button
          className={styles.button}
          onClick={handleExport}
          loading={exporting}
        >
          <FaDownload size={14} /> <Trans>Save Image</Trans>
        </Button>
      </div>

      <ConfirmationModal
        isOpen={confirmAction === "clear"}
        onClose={() => setConfirmAction(null)}
        title={_(msg`Unrank all characters?`)}
        description={_(
          msg`Every character goes back to the unranked roster. Your tiers stay as they are.`,
        )}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmationModal
        isOpen={confirmAction === "reset"}
        onClose={() => setConfirmAction(null)}
        title={_(msg`Start over?`)}
        description={_(
          msg`Tiers, the title, the palette and every character placement go back to the defaults.`,
        )}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </header>
  );
};
