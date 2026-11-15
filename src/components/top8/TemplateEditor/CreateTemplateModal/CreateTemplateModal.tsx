import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Modal } from "@/components/shared/Modal/Modal";
import { Button } from "@/components/shared/Button/Button";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { Field } from "@/components/top8/EditorForm/EditorForm";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";

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

  // The thumbnail should show the design alone, without the selection
  // outline or handles. Cleared outside the effect that calls this, since
  // flushSync cannot run while React is committing.
  await Promise.resolve();
  flushSync(() => {
    usePlayerStore.getState().dispatch({ type: "CLEAR_SELECTED_PLAYER" });
    useTournamentStore.getState().dispatch({ type: "CLEAR_SELECTED_ELEMENT" });
  });

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
  const titleId = useId();
  const nameId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
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

  // Start in the name field with the suggested name selected, so typing
  // replaces it.
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      nameRef.current?.focus();
      nameRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
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

  const name = templateName.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    createTemplate(name, previewBlob);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-labelledby={titleId}>
      <form className={styles.createTemplateModal} onSubmit={handleSubmit}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            <Trans>Save Design as Template</Trans>
          </h2>
          <p className={styles.description}>
            <Trans>
              Keeps the current layout, colors and font so you can load them
              again from My Templates.
            </Trans>
          </p>
        </header>

        <div className={styles.preview}>
          {isCapturing ? (
            <Spinner size={20} />
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={_(msg`Template preview`)}
              className={styles.previewImage}
            />
          ) : (
            <span className={styles.previewEmpty}>
              <Trans>No preview available</Trans>
            </span>
          )}
        </div>

        <Field
          ref={nameRef}
          id={nameId}
          label={_(msg`Template Name`)}
          type="text"
          placeholder={_(msg`Template Name`)}
          value={templateName}
          maxLength={60}
          autoComplete="off"
          onChange={(e) => setTemplateName(e.target.value)}
        />

        <footer className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            <Trans>Cancel</Trans>
          </Button>
          <Button type="submit" disabled={!name}>
            <Trans>Save Template</Trans>
          </Button>
        </footer>
      </form>
    </Modal>
  );
};
