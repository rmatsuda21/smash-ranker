import { useState } from "react";
import { RiFolderImageFill } from "react-icons/ri";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { useAssetDB } from "@/hooks/useAssetDb";
import { AssetsModal } from "@/components/top8/AssetManager/AssetsModal/AssetsModal";

import styles from "./AssetManager.module.scss";

type Props = {
  className?: string;
};

export const AssetManager = ({ className }: Props) => {
  const { _ } = useLingui();
  const [isOpen, setIsOpen] = useState(false);
  const { loading } = useAssetDB();

  const onClose = () => setIsOpen(false);

  return (
    <div className={cn(styles.assetManager, className)}>
      <Button
        variant="subtle"
        className={styles.button}
        loading={loading}
        onClick={() => setIsOpen(true)}
        aria-label={_(msg`Manage Assets`)}
      >
        <RiFolderImageFill size={16} />
        <span className={styles.label}>
          <Trans>Assets</Trans>
        </span>
      </Button>
      <AssetsModal isOpen={isOpen} onClose={onClose} />
    </div>
  );
};
