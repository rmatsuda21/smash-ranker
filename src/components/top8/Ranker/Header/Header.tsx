import { useState } from "react";
import cn from "classnames";
import { FaArrowRotateLeft, FaArrowRotateRight } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { TournamentLoader } from "@/components/top8/TournamentLoader/TournamentLoader";
import { CanvasDownloader } from "@/components/top8/CanvasDownloader/CanvasDownloader";
import { SocialShareButton } from "@/components/top8/SocialShareButton/SocialShareButton";
import { AssetManager } from "@/components/top8/AssetManager/AssetManager";
import { Button } from "@/components/shared/Button/Button";
import { useCanvasStore } from "@/store/canvasStore";
import { useHistoryStore } from "@/store/historyStore";
import { useStageBlobCache } from "@/hooks/top8/useStageBlobCache";

import styles from "./Header.module.scss";

export const Header = () => {
  const { _ } = useLingui();
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.past.length > 0);
  const canRedo = useHistoryStore((state) => state.future.length > 0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const blobCache = useStageBlobCache();

  return (
    <header className={styles.header}>
      <div className={cn(styles.group, styles.edit)}>
        <Button
          variant="subtle"
          className={styles.iconButton}
          onClick={undo}
          disabled={!canUndo}
          tooltip={_(msg`Undo`)}
        >
          <FaArrowRotateLeft size={14} />
        </Button>
        <Button
          variant="subtle"
          className={styles.iconButton}
          onClick={redo}
          disabled={!canRedo}
          tooltip={_(msg`Redo`)}
        >
          <FaArrowRotateRight size={14} />
        </Button>
        <span className={styles.divider} aria-hidden="true" />
        <AssetManager />
      </div>
      <TournamentLoader className={styles.tournamentLoader} />
      <div className={cn(styles.group, styles.export)}>
        <SocialShareButton
          isOpen={isShareOpen}
          onOpenChange={setIsShareOpen}
          blobCache={blobCache}
        />
        <CanvasDownloader
          onShare={() => setIsShareOpen(true)}
          blobCache={blobCache}
        />
      </div>
    </header>
  );
};
