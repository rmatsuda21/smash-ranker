import { useState } from "react";
import { RiFolderImageFill } from "react-icons/ri";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { useAssetDB } from "@/hooks/useAssetDb";
import { Spinner } from "@/components/shared/Spinner/Spinner";
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

  if (loading) return <Spinner size={25} />;

  return (
    <div className={cn(styles.assetManager, className)}>
      <div className={styles.content}>
        <p className={styles.label}>
          <Trans>Assets</Trans>
        </p>
        <Button onClick={() => setIsOpen(true)} tooltip={_(msg`Manage Assets`)}>
          <RiFolderImageFill />
        </Button>
      </div>
      <AssetsModal isOpen={isOpen} onClose={onClose} />
    </div>
  );
};
