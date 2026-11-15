import { useMemo, useRef, useState } from "react";
import { FaCheck, FaPlus } from "react-icons/fa6";
import { LuSearch } from "react-icons/lu";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { AssetThumb } from "@/components/top8/AssetManager/AssetThumb/AssetThumb";
import { useAssetUpload } from "@/hooks/useAssetUpload";
import { DBAsset } from "@/types/Repository";

import styles from "./AssetSelector.module.scss";

type Props = {
  assets: DBAsset[];
  uploadAsset: (asset: Omit<DBAsset, "id" | "src">) => Promise<string>;
  selectedSrc?: string;
  onPick: (src: string) => void;
  onManage: () => void;
};

// Quick picker shown in the selector's popover: one click picks an asset,
// and an upload is picked as soon as it is stored. The selector loads the
// library and passes it in, so the picker renders at full size immediately.
export const AssetPicker = ({
  assets,
  uploadAsset,
  selectedSrc,
  onPick,
  onManage,
}: Props) => {
  const { _ } = useLingui();
  const [query, setQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useAssetUpload(uploadAsset);

  // Newest first, narrowed by the search box.
  const visibleAssets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = [...assets].reverse();
    if (!needle) return sorted;
    return sorted.filter((a) => a.fileName.toLowerCase().includes(needle));
  }, [assets, query]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const [src] = await upload(files);
    if (src) onPick(src);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div className={styles.picker}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFiles}
        className={styles.hiddenInput}
      />

      {assets.length > 0 && (
        <label className={styles.search}>
          <LuSearch aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder={_(msg`Search assets`)}
            aria-label={_(msg`Search assets`)}
          />
        </label>
      )}

      {assets.length === 0 ? (
        <div className={styles.pickerEmpty}>
          <p>
            <Trans>No assets yet</Trans>
          </p>
          <Button onClick={openFilePicker}>
            <FaPlus size={12} />
            <Trans>Upload image</Trans>
          </Button>
        </div>
      ) : (
        <div className={styles.pickerGrid}>
          {!query.trim() && (
            <button
              type="button"
              className={cn(styles.pickerTile, styles.uploadTile)}
              onClick={openFilePicker}
              aria-label={_(msg`Upload image`)}
              title={_(msg`Upload image`)}
            >
              <FaPlus size={16} />
            </button>
          )}
          {visibleAssets.map((asset) => {
            const isSelected = asset.src === selectedSrc;
            return (
              <button
                key={asset.id}
                type="button"
                className={cn(styles.pickerTile, {
                  [styles.selected]: isSelected,
                })}
                onClick={() => onPick(asset.src)}
                aria-pressed={isSelected}
                aria-label={asset.fileName}
                title={asset.fileName}
              >
                <AssetThumb asset={asset} className={styles.pickerThumb} />
                {isSelected && (
                  <span className={styles.selectedBadge}>
                    <FaCheck size={8} />
                  </span>
                )}
              </button>
            );
          })}
          {visibleAssets.length === 0 && (
            <p className={styles.noMatch}>
              <Trans>No assets match your search</Trans>
            </p>
          )}
        </div>
      )}

      <div className={styles.pickerFooter}>
        <Button variant="subtle" size="sm" onClick={onManage}>
          <Trans>Manage Assets</Trans>
        </Button>
      </div>
    </div>
  );
};
