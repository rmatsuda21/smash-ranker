import { Suspense, lazy, useState } from "react";
import { TabNav } from "@radix-ui/themes";
import cn from "classnames";

import styles from "./SidePanel.module.scss";

const PlayerForm = lazy(() =>
  import("@/components/top8/PlayerForm/PlayerForm").then((module) => ({
    default: module.PlayerForm,
  }))
);

const ElementEditor = lazy(() =>
  import("@/components/top8/ElementEditor/ElementEditor").then((module) => ({
    default: module.ElementEditor,
  }))
);

const CanvasConfig = lazy(() =>
  import("@/components/top8/CanvasConfig/CanvasConfig").then((module) => ({
    default: module.CanvasConfig,
  }))
);

const TournamentConfig = lazy(() =>
  import("@/components/top8/TournamentConfig/TournamentConfig").then(
    (module) => ({
      default: module.TournamentConfig,
    })
  )
);

type Props = {
  className?: string;
};

type TabValue =
  | "player-form"
  | "element-editor"
  | "canvas-config"
  | "tournament-config";

const TABS: {
  label: string;
  value: TabValue;
  Component: React.ComponentType<{ className?: string }>;
}[] = [
  {
    label: "Tournament Config",
    value: "tournament-config",
    Component: TournamentConfig,
  },
  {
    label: "Player Form",
    value: "player-form",
    Component: PlayerForm,
  },
  {
    label: "Element Editor",
    value: "element-editor",
    Component: ElementEditor,
  },
  {
    label: "Canvas Config",
    value: "canvas-config",
    Component: CanvasConfig,
  },
];

export const SidePanel = ({ className }: Props) => {
  const [activeTab, setActiveTab] = useState<TabValue>("tournament-config");

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
  };

  return (
    <div className={cn(styles.wrapper, className)}>
      <TabNav.Root size="1">
        {TABS.map((tab) => (
          <TabNav.Link
            key={tab.value}
            active={activeTab === tab.value}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </TabNav.Link>
        ))}
      </TabNav.Root>

      <Suspense fallback={<div>Loading Configs...</div>}>
        {TABS.map(({ Component, value }) => (
          <Component
            key={value}
            className={cn({ [styles.hidden]: activeTab !== value })}
          />
        ))}
      </Suspense>
    </div>
  );
};
