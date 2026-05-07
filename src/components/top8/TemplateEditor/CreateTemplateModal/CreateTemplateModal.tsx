import { useEffect, useState } from "react";
import { IoMdCreate } from "react-icons/io";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Modal } from "@/components/shared/Modal/Modal";
import { Input } from "@/components/shared/Input/Input";
import { Button } from "@/components/shared/Button/Button";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { useCanvasStore } from "@/store/canvasStore";

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

const capturePreview = async (): Promise<Blob | undefined> => {
  const { stageRef } = useCanvasStore.getState();
  if (!stageRef) return undefined;

  try {
    const canvas = stageRef.toCanvas({ pixelRatio: 0.25 });
    return await new Promise<Blob | undefined>((resolve) => {
      canvas.toBlob(
        (blob) => {
          canvas.width = 0;
          canvas.height = 0;
          resolve(blob ?? undefined);
        },
        "image/webp",
        0.5,
      );
    });
  } catch {
    return undefined;
  }
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  createTemplate: (name: string, previewImage?: Blob) => void;
};

export const CreateTemplateModal = ({
  isOpen,
  onClose,
  createTemplate,
}: Props) => {
  const { _ } = useLingui();
  const [templateName, setTemplateName] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setTemplateName(getRandomTemplateName());
    setIsCapturing(true);
    setPreviewBlob(undefined);

    let cancelled = false;
    capturePreview().then((blob) => {
      if (cancelled) return;
      setPreviewBlob(blob);
      setIsCapturing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!previewBlob) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(previewBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewBlob]);

  const handleCreate = () => {
    createTemplate(templateName, previewBlob);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.createTemplateModal}>
        <h2 className={styles.title}>
          <Trans>Create Template</Trans>
        </h2>

        <div className={styles.previewWrapper}>
          {isCapturing ? (
            <div className={styles.previewPlaceholder}>
              <Spinner size={20} />
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={_(msg`Template preview`)}
              className={styles.previewImage}
            />
          ) : (
            <div className={styles.previewPlaceholder}>
              <span className={styles.previewEmpty}>
                <Trans>No preview available</Trans>
              </span>
            </div>
          )}
        </div>
        <span className={styles.caption}>
          <Trans>Preview of your saved template</Trans>
        </span>

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

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>
            <Trans>Cancel</Trans>
          </Button>
          <Button onClick={handleCreate} disabled={!templateName.trim()}>
            <IoMdCreate /> <Trans>Create</Trans>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
