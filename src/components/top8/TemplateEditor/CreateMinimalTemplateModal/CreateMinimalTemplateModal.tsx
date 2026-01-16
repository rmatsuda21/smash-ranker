import { useEffect, useState } from "react";
import { IoMdCreate } from "react-icons/io";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Modal } from "@/components/shared/Modal/Modal";
import { Input } from "@/components/shared/Input/Input";
import { Button } from "@/components/shared/Button/Button";

import styles from "./CreateMinimalTemplateModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  createTemplate: (name: string, playerCount: number) => void;
};

export const CreateMinimalTemplateModal = ({
  isOpen,
  onClose,
  createTemplate,
}: Props) => {
  const { _ } = useLingui();
  const [templateName, setTemplateName] = useState("");
  const [playerCount, setPlayerCount] = useState(8);

  useEffect(() => {
    if (isOpen) {
      setTemplateName(`Minimal (${playerCount} Players)`);
    }
  }, [isOpen, playerCount]);

  useEffect(() => {
    setTemplateName(`Minimal (${playerCount} Players)`);
  }, [playerCount]);

  const handleCreate = () => {
    if (playerCount < 1 || playerCount > 64) return;
    createTemplate(templateName, playerCount);
  };

  const handlePlayerCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setPlayerCount(Math.max(1, Math.min(64, value)));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.createMinimalTemplateModal}>
        <h2 className={styles.title}>
          <Trans>Custom Minimal Template</Trans>
        </h2>
        <p className={styles.description}>
          <Trans>Create a minimal template with a specific player count.</Trans>
        </p>

        <div className={styles.field}>
          <span className={styles.label}>
            <Trans>Player Count</Trans>
          </span>
          <Input
            type="number"
            min={1}
            max={64}
            placeholder={_(msg`Player Count`)}
            value={playerCount}
            onChange={handlePlayerCountChange}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>
            <Trans>Template Name</Trans>
          </span>
          <Input
            type="text"
            placeholder={_(msg`Template Name`)}
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>

        <Button
          onClick={handleCreate}
          disabled={playerCount < 1 || playerCount > 64}
        >
          <IoMdCreate /> <Trans>Create</Trans>
        </Button>
      </div>
    </Modal>
  );
};
