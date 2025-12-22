import { TournamentLoader } from "@/components/top8/TournamentLoader/TournamentLoader";
import { CanvasDownloader } from "@/components/top8/CanvasDownloader/CanvasDownloader";
import { ConfigManager } from "@/components/top8/ConfigManager/ConfigManager";

import styles from "./Header.module.scss";

export const Header = () => {
  return (
    <div className={styles.header}>
      <TournamentLoader className={styles.tournamentLoader} />
      <CanvasDownloader className={styles.canvasDownloader} />
      <ConfigManager className={styles.configConfig} />
    </div>
  );
};
