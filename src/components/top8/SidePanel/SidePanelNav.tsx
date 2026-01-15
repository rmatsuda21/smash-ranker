import { IoPerson, IoTrophy, IoText, IoPencil } from "react-icons/io5";
import { HiOutlineTemplate } from "react-icons/hi";
import { FaCircleInfo } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { MessageDescriptor } from "@lingui/core";
import cn from "classnames";

import { EditorTab } from "@/types/top8/Editor";

import styles from "./SidePanel.module.scss";
import { Button } from "@/components/shared/Button/Button";

const EditorTabLabels: Record<
  Exclude<EditorTab, EditorTab.CREDIT>,
  { label: MessageDescriptor; icon: React.ReactNode }
> = {
  [EditorTab.PLAYERS]: {
    label: msg`Players`,
    icon: <IoPerson />,
  },
  [EditorTab.DESIGN]: {
    label: msg`Design`,
    icon: <IoPencil />,
  },
  [EditorTab.TEXTS]: {
    label: msg`Texts`,
    icon: <IoText />,
  },
  [EditorTab.TOURNAMENT]: {
    label: msg`Tournament`,
    icon: <IoTrophy />,
  },
  [EditorTab.TEMPLATES]: {
    label: msg`Templates`,
    icon: <HiOutlineTemplate />,
  },
};

type Props = {
  activeTab: EditorTab | null;
  onTabChange: (tab: EditorTab) => void;
};

export const SidePanelNav = ({ activeTab, onTabChange }: Props) => {
  const { _ } = useLingui();

  return (
    <div className={cn(styles.nav)}>
      {Object.entries(EditorTabLabels).map(([key, value]) => (
        <button
          key={key}
          className={cn(styles.tab, { [styles.active]: activeTab === key })}
          onClick={() => onTabChange(key as EditorTab)}
        >
          <div className={styles.icon}>{value.icon}</div>
          <span>{_(value.label)}</span>
        </button>
      ))}
      <Button
        variant="ghost"
        className={cn(styles.credit, {
          [styles.active]: activeTab === EditorTab.CREDIT,
        })}
        onClick={() => onTabChange(EditorTab.CREDIT)}
      >
        <FaCircleInfo />
      </Button>
    </div>
  );
};
