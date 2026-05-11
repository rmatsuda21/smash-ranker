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
    <div className={styles.header}>
      <TournamentLoader className={cn(styles.item, styles.tournamentLoader)} />
      <CanvasDownloader
        className={styles.item}
        onShare={() => setIsShareOpen(true)}
        blobCache={blobCache}
      />
      <SocialShareButton
        className={styles.item}
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        blobCache={blobCache}
      />
      <AssetManager className={styles.item} />
      <div className={cn(styles.item, styles.historyControls)}>
        <Button onClick={undo} disabled={!canUndo}>
          <FaArrowRotateLeft size={16} />
          {_(msg`Undo`)}
        </Button>
        <Button onClick={redo} disabled={!canRedo}>
          <FaArrowRotateRight size={16} />
          {_(msg`Redo`)}
        </Button>
      </div>
    </div>
  );
};
