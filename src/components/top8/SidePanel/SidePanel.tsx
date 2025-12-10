import { Suspense, lazy } from "react";
import { TabNav } from "@radix-ui/themes";
import cn from "classnames";

import { EditorTab, EditorTabs } from "@/types/top8/EditorTypes";

import styles from "./SidePanel.module.scss";
import { useEditorStore } from "@/store/editorStore";

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

const TABS: {
  label: string;
  value: EditorTab;
  Component: React.ComponentType<{ className?: string }>;
}[] = [
  {
    label: "Tournament Config",
    value: EditorTabs.TOURNAMENT_CONFIG,
    Component: TournamentConfig,
  },
  {
    label: "Player Form",
    value: EditorTabs.PLAYER_FORM,
    Component: PlayerForm,
  },
  {
    label: "Element Editor",
    value: EditorTabs.ELEMENT_EDITOR,
    Component: ElementEditor,
  },
  {
    label: "Canvas Config",
    value: EditorTabs.CANVAS_CONFIG,
    Component: CanvasConfig,
  },
];

export const SidePanel = ({ className }: Props) => {
  const activeTab = useEditorStore((state) => state.activeTab);
  const dispatch = useEditorStore((state) => state.dispatch);

  const handleTabChange = (tab: EditorTab) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: tab });
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
