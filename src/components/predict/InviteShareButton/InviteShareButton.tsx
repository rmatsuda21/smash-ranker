import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { FaLink } from "react-icons/fa6";

import { ConfirmableButton } from "@/components/shared/ConfirmableButton/ConfirmableButton";
import { detectPlatformAndSlug } from "@/consts/platforms";
import { usePredictionStore } from "@/store/predictionStore";
import { encodeInvite } from "@/utils/predict/inviteCode";

import styles from "./InviteShareButton.module.scss";

type Props = {
  className?: string;
};

export const InviteShareButton = ({ className }: Props) => {
  const { _ } = useLingui();
  const tournamentUrl = usePredictionStore((s) => s.tournamentUrl);

  const detected = tournamentUrl ? detectPlatformAndSlug(tournamentUrl) : null;
  if (!detected) return null;

  const handleCopy = async () => {
    const inviteUrl = `https://smash-ranker.app/predict?d=${encodeInvite(detected)}`;
    await navigator.clipboard.writeText(inviteUrl);
  };

  return (
    <ConfirmableButton
      className={className}
      variant="outline"
      size="sm"
      icon={<FaLink />}
      label={
        <span className={styles.text}>
          <Trans>Share invite</Trans>
        </span>
      }
      confirmLabel={
        <span className={styles.text}>
          <Trans>Copied!</Trans>
        </span>
      }
      ariaLabel={_(msg`Share invite`)}
      onAction={handleCopy}
    />
  );
};
