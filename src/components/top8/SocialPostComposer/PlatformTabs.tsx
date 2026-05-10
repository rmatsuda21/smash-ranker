import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { FaXTwitter, FaBluesky } from "react-icons/fa6";

import type { SocialPlatform } from "@/types/social/SocialTemplate";

import styles from "./SocialPostComposer.module.scss";

type Props = {
  selected: SocialPlatform;
  onSelect: (platform: SocialPlatform) => void;
};

export const PlatformTabs = ({ selected, onSelect }: Props) => (
  <div className={styles.tabs} role="tablist">
    <button
      role="tab"
      aria-selected={selected === "x"}
      className={cn(styles.tab, { [styles.tabActive]: selected === "x" })}
      onClick={() => onSelect("x")}
    >
      <FaXTwitter className={styles.tabIcon} aria-hidden="true" />
      <Trans>X</Trans>
    </button>
    <button
      role="tab"
      aria-selected={selected === "bluesky"}
      className={cn(styles.tab, {
        [styles.tabActive]: selected === "bluesky",
      })}
      onClick={() => onSelect("bluesky")}
    >
      <FaBluesky className={styles.tabIcon} aria-hidden="true" />
      <Trans>Bluesky</Trans>
    </button>
  </div>
);
