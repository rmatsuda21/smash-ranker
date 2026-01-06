import { IoPerson, IoTrophy } from "react-icons/io5";
import { IoPencil } from "react-icons/io5";
import { IoText } from "react-icons/io5";
import { FaFile } from "react-icons/fa6";

import { EditorTab } from "@/types/top8/Editor";

const EditorTabLabels: Record<
  EditorTab,
  { label: string; icon: React.ReactNode }
> = {
  [EditorTab.PLAYERS]: {
    label: "Players",
    icon: <IoPerson />,
  },
  [EditorTab.DESIGN]: {
    label: "Design",
    icon: <IoPencil />,
  },
  [EditorTab.TEXTS]: {
    label: "Texts",
    icon: <IoText />,
  },
  [EditorTab.TOURNAMENT]: {
    label: "Tournament",
    icon: <IoTrophy />,
  },
  [EditorTab.TEMPLATES]: {
    label: "Templates",
    icon: <FaFile />,
  },
};

type Props = {
  activeTab: EditorTab | null;
  onTabChange: (tab: EditorTab) => void;
  className?: string;
};

export const SidePanelNav = ({ activeTab, onTabChange, className }: Props) => {
  return (
    <div className={className}>
      {Object.entries(EditorTabLabels).map(([key, value]) => (
        <button
          key={key}
          className={`${activeTab === key ? "active" : ""}`}
          onClick={() => onTabChange(key as EditorTab)}
        >
          <div className="icon">{value.icon}</div>
          <span>{value.label}</span>
        </button>
      ))}
    </div>
  );
};
