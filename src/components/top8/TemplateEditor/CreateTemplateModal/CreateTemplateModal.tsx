import { useEffect, useState } from "react";
import { IoMdCreate } from "react-icons/io";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Modal } from "@/components/shared/Modal/Modal";
import { Input } from "@/components/shared/Input/Input";
import { Button } from "@/components/shared/Button/Button";

import styles from "./CreateTemplateModal.module.scss";

const ADJECTIVES = [
  "Awesome",
  "Amazing",
  "Cool",
  "Fantastic",
  "Great",
  "Incredible",
  "Super",
  "Best",
  "Brilliant",
  "Clever",
];

const getRandomTemplateName = () => {
  return `My ${
    ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  } Template`;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  createTemplate: (name: string) => void;
};

export const CreateTemplateModal = ({
  isOpen,
  onClose,
  createTemplate,
}: Props) => {
  const { _ } = useLingui();
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    setTemplateName(getRandomTemplateName());
  }, [isOpen]);

  const handleCreate = () => {
    createTemplate(templateName);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.createTemplateModal}>
        <h2 className={styles.title}>
          <Trans>Create Template</Trans>
        </h2>
        <span className={styles.label}>
          <Trans>Template Name</Trans>
        </span>
        <Input
          type="text"
          placeholder={_(msg`Template Name`)}
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
        <Button onClick={handleCreate}>
          <IoMdCreate /> <Trans>Create</Trans>
        </Button>
      </div>
    </Modal>
  );
};
