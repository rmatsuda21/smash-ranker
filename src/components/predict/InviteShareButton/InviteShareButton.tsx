import { useState } from "react";
import { Trans } from "@lingui/react/macro";
import { FaLink, FaCircleCheck } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { detectPlatformAndSlug } from "@/consts/platforms";
import { usePredictionStore } from "@/store/predictionStore";

import styles from "./InviteShareButton.module.scss";

export const InviteShareButton = () => {
  const tournamentUrl = usePredictionStore((s) => s.tournamentUrl);
  const [copied, setCopied] = useState(false);

  const detected = tournamentUrl ? detectPlatformAndSlug(tournamentUrl) : null;
  if (!detected) return null;

  const handleCopy = async () => {
    const inviteUrl = `https://smash-ranker.app/predict?p=${detected.platform}&s=${encodeURIComponent(detected.slug)}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={copied ? styles.copied : undefined}
    >
      <span className={styles.copyLabel}>
        <span className={`${styles.copyInner} ${copied ? styles.hidden : ""}`}>
          <FaLink />
          <Trans>Share invite</Trans>
        </span>
        {copied && (
          <span className={styles.copiedOverlay}>
            <FaCircleCheck />
            <Trans>Copied!</Trans>
          </span>
        )}
      </span>
    </Button>
  );
};
