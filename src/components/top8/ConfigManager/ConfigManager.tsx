import cn from "classnames";

import { ConfigExport } from "@/components/top8/ConfigManager/ConfigExport";
import { ConfigImport } from "@/components/top8/ConfigManager/ConfigImport";
import { ConfigSelector } from "@/components/top8/ConfigManager/ConfigSelector";

import styles from "./ConfigManager.module.scss";

type Props = {
  className?: string;
};

export const ConfigManager = ({ className }: Props) => {
  return (
    <div className={cn(styles.wrapper, className)}>
      <p className={styles.label}>Config Manager</p>
      <div className={styles.buttons}>
        <ConfigExport />
        <ConfigImport />
      </div>
      <ConfigSelector />
    </div>
  );
};
