import { IoPerson, IoTrophy, IoText, IoPencil } from "react-icons/io5";
import { HiOutlineTemplate } from "react-icons/hi";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { MessageDescriptor } from "@lingui/core";

import { EditorTab } from "@/types/top8/Editor";

const EditorTabLabels: Record<
  EditorTab,
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
  className?: string;
};

export const SidePanelNav = ({ activeTab, onTabChange, className }: Props) => {
  const { _ } = useLingui();

  return (
    <div className={className}>
      {Object.entries(EditorTabLabels).map(([key, value]) => (
        <button
          key={key}
          className={`${activeTab === key ? "active" : ""}`}
          onClick={() => onTabChange(key as EditorTab)}
        >
          <div className="icon">{value.icon}</div>
          <span>{_(value.label)}</span>
        </button>
      ))}
    </div>
  );
};
