import cn from "classnames";

import { TournamentLoader } from "@/components/top8/TournamentLoader/TournamentLoader";
import { CanvasDownloader } from "@/components/top8/CanvasDownloader/CanvasDownloader";
import { AssetManager } from "@/components/top8/AssetManager/AssetManager";

import styles from "./Header.module.scss";

export const Header = () => {
  return (
    <div className={styles.header}>
      <TournamentLoader className={cn(styles.item, styles.tournamentLoader)} />
      <CanvasDownloader className={styles.item} />
      <AssetManager className={styles.item} />
    </div>
  );
};
