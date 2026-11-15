import cn from "classnames";

import { useBlobUrl } from "@/hooks/useBlobUrl";
import { DBAsset } from "@/types/Repository";

import styles from "./AssetThumb.module.scss";

type Props = {
  asset: DBAsset;
  className?: string;
};

// Renders from the stored blob rather than the asset's `/idb-images/` src, so
// it doesn't depend on the image service worker being in control of the page.
export const AssetThumb = ({ asset, className }: Props) => {
  const url = useBlobUrl(asset.data);

  return (
    <span className={cn(styles.thumb, className)}>
      {url && <img src={url} alt={asset.fileName} draggable={false} />}
    </span>
  );
};
