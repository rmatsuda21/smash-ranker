import cn from "classnames";
import { IoArrowUndo, IoArrowRedo } from "react-icons/io5";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { TournamentLoader } from "@/components/top8/TournamentLoader/TournamentLoader";
import { CanvasDownloader } from "@/components/top8/CanvasDownloader/CanvasDownloader";
import { AssetManager } from "@/components/top8/AssetManager/AssetManager";
import { Button } from "@/components/shared/Button/Button";
import { useCanvasStore } from "@/store/canvasStore";
import { useHistoryStore } from "@/store/historyStore";

import styles from "./Header.module.scss";

export const Header = () => {
  const { _ } = useLingui();
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.past.length > 0);
  const canRedo = useHistoryStore((state) => state.future.length > 0);

  return (
    <div className={styles.header}>
      <TournamentLoader className={cn(styles.item, styles.tournamentLoader)} />
      <CanvasDownloader className={styles.item} />
      <AssetManager className={styles.item} />
      <div className={cn(styles.item, styles.historyControls)}>
        <Button
          className={styles.historyButton}
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          tooltip={_(msg`Undo`)}
        >
          <IoArrowUndo />
        </Button>
        <Button
          className={styles.historyButton}
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          tooltip={_(msg`Redo`)}
        >
          <IoArrowRedo />
        </Button>
      </div>
    </div>
  );
};
