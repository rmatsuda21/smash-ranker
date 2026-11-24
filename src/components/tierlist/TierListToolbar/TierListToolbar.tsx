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
import { TierExportModal } from "@/components/tierlist/TierExportModal/TierExportModal";
import { TierDesignBar } from "@/components/tierlist/TierDesignBar/TierDesignBar";
import { useTierListStore } from "@/store/tierListStore";

import styles from "./TierListToolbar.module.scss";

type Props = {
  exportRef: React.RefObject<HTMLDivElement | null>;
};

export const TierListToolbar = ({ exportRef }: Props) => {
  const { _ } = useLingui();
  const dispatch = useTierListStore((s) => s.dispatch);

  const [exportOpen, setExportOpen] = useState(false);

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
        <Button className={styles.button} onClick={() => setExportOpen(true)}>
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
      <TierExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        exportRef={exportRef}
      />
    </header>
  );
};
