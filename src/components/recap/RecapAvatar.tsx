import { useState, type CSSProperties } from "react";
import cn from "classnames";

import { hueOf } from "@/utils/recap/recapText";

import styles from "./recap.module.scss";

type Props = {
  name: string;
  url: string | null;
  className?: string;
};

// A player's start.gg picture, or their tag's first letter on a colour of
// its own when they have none (or it fails to load).
export const RecapAvatar = ({ name, url, className }: Props) => {
  const [failed, setFailed] = useState(false);
  const showImage = url && !failed;

  return (
    <span
      className={cn(styles.av, className)}
      style={{ "--h": hueOf(name) } as CSSProperties}
      aria-hidden="true"
    >
      {showImage ? (
        <img src={url} alt="" onError={() => setFailed(true)} />
      ) : (
        <b>{name.slice(0, 1)}</b>
      )}
    </span>
  );
};
