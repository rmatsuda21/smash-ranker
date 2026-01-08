import { useEffect, useState } from "react";

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
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    setTemplateName(getRandomTemplateName());
  }, [isOpen]);

  const handleCreate = () => {
    createTemplate(templateName);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        <h1>Create Template</h1>
        <p>Enter a name for your new template.</p>
        <Input
          type="text"
          placeholder="Template Name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
        <Button onClick={handleCreate}>Create</Button>
      </div>
    </Modal>
  );
};
