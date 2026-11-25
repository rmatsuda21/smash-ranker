import { useState } from "react";
import { FaCode } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal/ConfirmationModal";
import pkg from "../../../../package.json";

import settingsStyles from "./SettingsPanel.module.scss";
import styles from "./DeveloperSettings.module.scss";

const commitSha = import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA;
const buildInfo = {
  mode: import.meta.env.MODE,
  commit: commitSha ? commitSha.slice(0, 7) : "local",
  version: pkg.version,
};

export const DeveloperSettings = () => {
  const { _ } = useLingui();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleConfirm = async () => {
    setResetting(true);
    const { factoryReset } = await import("@/utils/debug/factoryReset");
    await factoryReset();
  };

  return (
    <section className={settingsStyles.section}>
      <div className={settingsStyles.sectionHeader}>
        <FaCode className={settingsStyles.sectionIcon} />
        <h3 className={settingsStyles.sectionTitle}>
          <Trans>Developer</Trans>
        </h3>
      </div>

      <div className={styles.row}>
        <Button
          variant="outline"
          onClick={() => setConfirmOpen(true)}
          loading={resetting}
        >
          <Trans>Reset application state</Trans>
        </Button>
      </div>

      <dl className={styles.buildInfo}>
        <div className={styles.buildRow}>
          <dt>
            <Trans>Mode</Trans>
          </dt>
          <dd>{buildInfo.mode}</dd>
        </div>
        <div className={styles.buildRow}>
          <dt>
            <Trans>Commit</Trans>
          </dt>
          <dd>{buildInfo.commit}</dd>
        </div>
        <div className={styles.buildRow}>
          <dt>
            <Trans>Version</Trans>
          </dt>
          <dd>{buildInfo.version}</dd>
        </div>
      </dl>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={_(msg`Reset application state`)}
        description={_(
          msg`This will permanently delete all saved templates, custom fonts, uploaded assets, and design settings. The page will reload.`,
        )}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
};
