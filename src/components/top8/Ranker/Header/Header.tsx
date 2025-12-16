import { TournamentLoader } from "@/components/top8/TournamentLoader/TournamentLoader";
import { CanvasDownloader } from "@/components/top8/CanvasDownloader/CanvasDownloader";

import styles from "./Header.module.scss";

export const Header = () => {
  return (
    <div className={styles.wrapper}>
      <TournamentLoader className={styles.tournamentLoader} />
      <CanvasDownloader className={styles.canvasDownloader} />
    </div>
  );
};
