import { useEffect, useId, useMemo, useState } from "react";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import {
  FaArrowUpFromBracket,
  FaCopy,
  FaDownload,
  FaXmark,
} from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmableButton } from "@/components/shared/ConfirmableButton/ConfirmableButton";
import { Modal } from "@/components/shared/Modal/Modal";
import { useToast } from "@/components/Toast";
import { PlayerCard } from "@/components/user/PlayerCard/PlayerCard";
import { markExported } from "@/utils/analytics/markExported";
import { logEvent, logWarning } from "@/utils/observability/log";
import {
  canShareImage,
  copyImageToClipboard,
} from "@/utils/social/clipboardImage";
import type { ShareMethod } from "@/utils/analytics/events";
import { downloadBlob, shareMethodFor } from "@/utils/top8/downloadBlob";
import {
  renderPlayerCardImage,
  type PlayerCardAssets,
  type PlayerCardData,
} from "@/utils/user/playerCard";

import styles from "./PlayerCardModal.module.scss";

type Props = {
  data: PlayerCardData;
  assets: PlayerCardAssets;
  onClose: () => void;
};

const filenameFor = (tag: string) =>
  `${
    tag
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "player"
  }-card.png`;

// Phones and tablets tilt; everything else has a mouse.
const usesTouch = () => window.matchMedia("(pointer: coarse)").matches;

// The player's card at full size, with the ways to post it.
export const PlayerCardModal = ({ data, assets, onClose }: Props) => {
  const { _ } = useLingui();
  const { showToast } = useToast();
  const titleId = useId();

  // The image to share, made ahead of the tap so the share sheet opens
  // straight from it.
  const [blob, setBlob] = useState<Blob | null>(null);
  const [renderFailed, setRenderFailed] = useState(false);
  // Counts the tries, so "Try again" runs the render once more.
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const startedAt = performance.now();
    setRenderFailed(false);
    logEvent("graphic_export_start", {
      export_surface: "player_card",
      export_format: "png",
    });
    renderPlayerCardImage(data, assets)
      .then((image) => {
        if (!cancelled) setBlob(image);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        logWarning("player card render failed", {
          area: "user",
          error: err instanceof Error ? err.message : String(err),
        });
        logEvent("graphic_export_fail", {
          export_surface: "player_card",
          export_format: "png",
          failure_kind: "render_threw",
          duration_ms: Math.round(performance.now() - startedAt),
        });
        setRenderFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [data, assets, attempt]);

  const file = useMemo(
    () =>
      blob
        ? new File([blob], filenameFor(data.tag), { type: "image/png" })
        : null,
    [blob, data.tag],
  );
  const canShare = file !== null && canShareImage(file);

  const logExport = (share_method: ShareMethod) => {
    logEvent("graphic_export_complete", {
      export_surface: "player_card",
      export_format: "png",
      share_method,
    });
    markExported();
  };

  const handleShare = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [file] });
      logExport("share_sheet");
    } catch (err) {
      // Closing the share sheet is not an error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      logWarning("player card share failed", {
        area: "user",
        error: err instanceof Error ? err.message : String(err),
      });
      showToast(_(msg`Couldn't open the share sheet. Try Download instead.`), {
        variant: "error",
      });
    }
  };

  const handleDownload = async () => {
    if (!blob || !file) return;
    const outcome = await downloadBlob({
      blob,
      filename: file.name,
      mimeType: "image/png",
    });
    if (outcome !== "cancelled") logExport(shareMethodFor(outcome));
  };

  const handleCopy = async () => {
    if (!blob) return false;
    const result = await copyImageToClipboard(blob);
    if (result.ok) {
      logEvent("graphic_share", {
        export_surface: "player_card",
        share_method: "clipboard",
      });
    }
    return result.ok;
  };

  return (
    <Modal isOpen onClose={onClose} aria-labelledby={titleId}>
      <div className={styles.root}>
        <div className={styles.heading}>
          <h2 id={titleId} className={styles.title}>
            <Trans>Your player card</Trans>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            aria-label={_(msg`Close`)}
            onClick={onClose}
          >
            <FaXmark aria-hidden="true" />
          </Button>
        </div>

        <div className={styles.stage}>
          <PlayerCard
            data={data}
            assets={assets}
            label={_(msg`Player card for ${data.tag}`)}
          />
        </div>

        <p className={styles.hint}>
          {usesTouch() ? (
            <Trans>Tap the card, then tilt your phone</Trans>
          ) : (
            <Trans>Move your mouse over the card</Trans>
          )}
        </p>

        {renderFailed && (
          <p className={styles.error} role="alert">
            <Trans>Couldn't make the image to share.</Trans>{" "}
            <button
              type="button"
              className={styles.retry}
              onClick={() => setAttempt((n) => n + 1)}
            >
              <Trans>Try again</Trans>
            </button>
          </p>
        )}

        <div className={styles.actions}>
          {canShare && (
            <Button onClick={handleShare}>
              <FaArrowUpFromBracket aria-hidden="true" />
              <Trans>Share</Trans>
            </Button>
          )}
          <Button
            variant={canShare ? "outline" : "solid"}
            disabled={!blob}
            onClick={handleDownload}
          >
            <FaDownload aria-hidden="true" />
            <Trans>Download</Trans>
          </Button>
          <ConfirmableButton
            variant="outline"
            icon={<FaCopy aria-hidden="true" />}
            label={<Trans>Copy</Trans>}
            confirmLabel={<Trans>Copied!</Trans>}
            disabled={!blob}
            onAction={handleCopy}
          />
        </div>
      </div>
    </Modal>
  );
};
