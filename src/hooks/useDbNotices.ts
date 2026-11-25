import { useEffect } from "react";
import { useLingui } from "@lingui/react/macro";

import { useToast } from "@/components/Toast";
import { subscribeDbNotices } from "@/db/dbEvents";

const NOTICE_DURATION_MS = 12000;

// Tells the user when saved templates, images and fonts cannot be reached
// because of another tab. Mount once, inside the toast provider.
export const useDbNotices = () => {
  const { showToast } = useToast();
  const { t } = useLingui();

  useEffect(
    () =>
      subscribeDbNotices((notice) => {
        showToast(
          notice === "blocked"
            ? t`Smash Ranker is open in another tab with an older version. Close the other tabs to load your saved templates and images.`
            : t`A newer version of Smash Ranker is open in another tab. Reload this tab to keep saving.`,
          { variant: "error", durationMs: NOTICE_DURATION_MS },
        );
      }),
    [showToast, t],
  );
};
