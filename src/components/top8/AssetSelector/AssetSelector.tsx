import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaImage, FaXmark } from "react-icons/fa6";
import { GrDocumentMissing } from "react-icons/gr";
import cn from "classnames";
import { useLingui } from "@lingui/react";
import { msg } from "@lingui/core/macro";

import { AssetsModal } from "@/components/top8/AssetManager/AssetsModal/AssetsModal";
import { Popover } from "@/components/shared/Popover/Popover";
import { assetRepository } from "@/db/repository";
import { useAssetDB } from "@/hooks/useAssetDb";
import { useBlobUrl } from "@/hooks/useBlobUrl";
import { DBAsset } from "@/types/Repository";

import { AssetPicker } from "./AssetPicker";
import styles from "./AssetSelector.module.scss";

type Props = {
  selectedSrc?: string;
  onSelect?: (src: string) => void;
  onClear: () => void;
  disabled?: boolean;
};

export const AssetSelector = ({
  selectedSrc,
  onSelect,
  onClear,
  disabled,
}: Props) => {
  const { _ } = useLingui();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [asset, setAsset] = useState<DBAsset | null>(null);
  const [notFound, setNotFound] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const imgUrl = useBlobUrl(asset?.data);

  // The library is loaded here, before the picker opens, so the popover is
  // at its final size on its first frame. Loading inside the picker made it
  // open small below the field and then jump above once the grid appeared.
  const { assets, uploadAsset, refresh } = useAssetDB();

  const togglePicker = async () => {
    if (isPickerOpen) {
      setIsPickerOpen(false);
      return;
    }
    await refresh();
    setIsPickerOpen(true);
  };

  useEffect(() => {
    if (!selectedSrc) {
      setAsset(null);
      setNotFound(false);
      return;
    }

    let cancelled = false;
    assetRepository.get(selectedSrc).then((found) => {
      if (cancelled) return;
      setAsset(found?.data ? found : null);
      setNotFound(!found?.data);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedSrc]);

  const label = notFound
    ? _(msg`Missing image`)
    : (asset?.fileName ?? _(msg`Choose image`));

  return (
    <div
      ref={anchorRef}
      className={cn(styles.assetSelector, { [styles.disabled]: disabled })}
    >
      <button
        type="button"
        className={styles.trigger}
        onClick={togglePicker}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isPickerOpen}
        title={asset?.fileName}
      >
        <span className={styles.thumb}>
          {notFound ? (
            <GrDocumentMissing size={16} />
          ) : imgUrl ? (
            <img src={imgUrl} alt="" />
          ) : (
            <FaImage size={16} />
          )}
        </span>
        <span
          className={cn(styles.label, {
            [styles.placeholder]: !asset && !notFound,
          })}
        >
          {label}
        </span>
        {!selectedSrc && <FaChevronDown className={styles.chevron} size={10} />}
      </button>
      {selectedSrc && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onClear()}
          disabled={disabled}
          aria-label={_(msg`Clear`)}
          title={_(msg`Clear`)}
        >
          <FaXmark size={12} />
        </button>
      )}

      <Popover
        anchorRef={anchorRef}
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        placement="bottom-start"
        offset={6}
        minWidth={320}
        className={styles.popover}
      >
        <AssetPicker
          assets={assets}
          uploadAsset={uploadAsset}
          selectedSrc={selectedSrc}
          onPick={(src) => {
            onSelect?.(src);
            setIsPickerOpen(false);
          }}
          onManage={() => {
            setIsPickerOpen(false);
            setIsManagerOpen(true);
          }}
        />
      </Popover>

      <AssetsModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        onSelect={onSelect}
        selectedSrc={selectedSrc}
      />
    </div>
  );
};
