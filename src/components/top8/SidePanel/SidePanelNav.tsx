import { Fragment } from "react";
import { IoPerson, IoTrophy, IoText, IoPencil } from "react-icons/io5";
import { HiOutlineTemplate } from "react-icons/hi";
import { FaCircleInfo, FaGear } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { MessageDescriptor } from "@lingui/core";
import cn from "classnames";

import { EditorTab } from "@/types/top8/Editor";

import styles from "./SidePanel.module.scss";
import { Button } from "@/components/shared/Button/Button";

const EditorTabLabels: Record<
  Exclude<EditorTab, EditorTab.CREDIT | EditorTab.SETTINGS>,
  { label: MessageDescriptor; icon: React.ReactNode }
> = {
  [EditorTab.PLAYERS]: {
    label: msg`Players`,
    icon: <IoPerson />,
  },
  [EditorTab.TOURNAMENT]: {
    label: msg`Tournament`,
    icon: <IoTrophy />,
  },
  [EditorTab.DESIGN]: {
    label: msg`Design`,
    icon: <IoPencil />,
  },
  [EditorTab.TEXTS]: {
    label: msg`Texts`,
    icon: <IoText />,
  },
  [EditorTab.TEMPLATES]: {
    label: msg`Templates`,
    icon: <HiOutlineTemplate />,
  },
};

type NavTab = Exclude<EditorTab, EditorTab.CREDIT | EditorTab.SETTINGS>;

const TabGroups: NavTab[][] = [
  [EditorTab.PLAYERS, EditorTab.TOURNAMENT],
  [EditorTab.DESIGN, EditorTab.TEXTS],
  [EditorTab.TEMPLATES],
];

type Props = {
  activeTab: EditorTab | null;
  onTabChange: (tab: EditorTab) => void;
};

export const SidePanelNav = ({ activeTab, onTabChange }: Props) => {
  const { _ } = useLingui();

  return (
    <div className={cn(styles.nav)}>
      {TabGroups.map((group, groupIndex) => (
        <Fragment key={groupIndex}>
          {groupIndex > 0 && <div className={styles.divider} />}
          {group.map((tab) => (
            <button
              key={tab}
              className={cn(styles.tab, { [styles.active]: activeTab === tab })}
              onClick={() => onTabChange(tab)}
            >
              <div className={styles.icon}>{EditorTabLabels[tab].icon}</div>
              <span>{_(EditorTabLabels[tab].label)}</span>
            </button>
          ))}
        </Fragment>
      ))}
      <div className={styles.bottomButtons}>
        <Button
          variant="ghost"
          className={cn(styles.bottomButton, {
            [styles.active]: activeTab === EditorTab.SETTINGS,
          })}
          onClick={() => onTabChange(EditorTab.SETTINGS)}
          aria-label="Settings"
        >
          <FaGear />
        </Button>
        <Button
          variant="ghost"
          className={cn(styles.bottomButton, {
            [styles.active]: activeTab === EditorTab.CREDIT,
          })}
          onClick={() => onTabChange(EditorTab.CREDIT)}
          aria-label="Info"
        >
          <FaCircleInfo />
        </Button>
      </div>
    </div>
  );
};
