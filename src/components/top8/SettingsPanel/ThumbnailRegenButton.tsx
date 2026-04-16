import { useState } from "react";
import { FaImages } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { previewCache } from "@/db/previewCache";
import { useEditorStore } from "@/store/editorStore";

import styles from "./SettingsPanel.module.scss";

export const ThumbnailRegenButton = () => {
  const { _ } = useLingui();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const dispatch = useEditorStore((state) => state.dispatch);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await previewCache.clear();
      dispatch({ type: "INVALIDATE_PREVIEW_CACHE" });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <FaImages className={styles.sectionIcon} />
        <h3 className={styles.sectionTitle}>{_(msg`Thumbnails`)}</h3>
      </div>
      <p className={styles.sectionDesc}>
        {_(msg`Regenerate all template preview thumbnails.`)}
      </p>
      <Button
        variant="outline"
        size="sm"
        loading={isRegenerating}
        onClick={handleRegenerate}
      >
        {_(msg`Regenerate Thumbnails`)}
      </Button>
    </section>
  );
};
