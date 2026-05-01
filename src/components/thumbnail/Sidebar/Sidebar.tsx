import {
  FaChevronUp,
  FaImage,
  FaLayerGroup,
  FaPalette,
  FaPlus,
  FaSliders,
  FaTableCells,
} from "react-icons/fa6";
import cn from "classnames";

import { useThumbnailEditorStore, SidebarTab } from "@/store/thumbnailEditorStore";

import { AddElementTab } from "./tabs/AddElementTab";
import { LayersTab } from "./tabs/LayersTab";
import { PropertiesTab } from "./tabs/PropertiesTab";
import { TemplatesTab } from "./tabs/TemplatesTab";
import { BackgroundTab } from "./tabs/BackgroundTab";
import { SettingsTab } from "./tabs/SettingsTab";

import styles from "./Sidebar.module.scss";

const TABS: Array<{
  id: SidebarTab;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: "add", label: "Add", Icon: FaPlus },
  { id: "layers", label: "Layers", Icon: FaLayerGroup },
  { id: "properties", label: "Props", Icon: FaSliders },
  { id: "templates", label: "Templates", Icon: FaTableCells },
  { id: "background", label: "BG", Icon: FaImage },
  { id: "settings", label: "Settings", Icon: FaPalette },
];

const TAB_CONTENT: Record<SidebarTab, React.ComponentType> = {
  add: AddElementTab,
  layers: LayersTab,
  properties: PropertiesTab,
  templates: TemplatesTab,
  background: BackgroundTab,
  settings: SettingsTab,
};

export const Sidebar = () => {
  const activeTab = useThumbnailEditorStore((s) => s.activeSidebarTab);
  const setActiveTab = useThumbnailEditorStore((s) => s.setActiveSidebarTab);
  const TabContent = TAB_CONTENT[activeTab];

  return (
    <div className={styles.root}>
      <div className={styles.tabs}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={cn(styles.tab, { [styles.active]: activeTab === id })}
            onClick={() => setActiveTab(id)}
            aria-label={label}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className={styles.body}>
        <TabContent />
      </div>
      <FaChevronUp style={{ display: "none" }} />
    </div>
  );
};
