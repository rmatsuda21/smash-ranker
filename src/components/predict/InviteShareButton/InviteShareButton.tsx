import { Trans } from "@lingui/react/macro";
import { FaLink } from "react-icons/fa6";

import { ConfirmableButton } from "@/components/shared/ConfirmableButton/ConfirmableButton";
import { detectPlatformAndSlug } from "@/consts/platforms";
import { usePredictionStore } from "@/store/predictionStore";
import { encodeInvite } from "@/utils/predict/inviteCode";

export const InviteShareButton = () => {
  const tournamentUrl = usePredictionStore((s) => s.tournamentUrl);

  const detected = tournamentUrl ? detectPlatformAndSlug(tournamentUrl) : null;
  if (!detected) return null;

  const handleCopy = async () => {
    const inviteUrl = `https://smash-ranker.app/predict?d=${encodeInvite(detected)}`;
    await navigator.clipboard.writeText(inviteUrl);
  };

  return (
    <ConfirmableButton
      variant="outline"
      size="sm"
      icon={<FaLink />}
      label={<Trans>Share invite</Trans>}
      confirmLabel={<Trans>Copied!</Trans>}
      onAction={handleCopy}
    />
  );
};
