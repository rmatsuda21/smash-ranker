import { Suspense, lazy } from "react";
import cn from "classnames";

import { EditorTab, EditorTabs } from "@/types/top8/EditorTypes";

import styles from "./SidePanel.module.scss";
import { useEditorStore } from "@/store/editorStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { TabNav } from "@/components/shared/TabNav/TabNav";

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
}[] = [
  {
    label: "Tournament Config",
    value: EditorTabs.TOURNAMENT_CONFIG,
  },
  {
    label: "Player Form",
    value: EditorTabs.PLAYER_FORM,
  },
  {
    label: "Element Editor",
    value: EditorTabs.ELEMENT_EDITOR,
  },
  {
    label: "Canvas Config",
    value: EditorTabs.CANVAS_CONFIG,
  },
];

export const SidePanel = ({ className }: Props) => {
  const activeTab = useEditorStore((state) => state.activeTab);
  const dispatch = useEditorStore((state) => state.dispatch);
  const tournamentLayout = useCanvasStore((state) => state.layout.tournament);
  const selectedElementIndex = useTournamentStore(
    (state) => state.selectedElementIndex
  );
  const handleTabChange = (tab: EditorTab) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: tab });
  };

  return (
    <div className={cn(styles.wrapper, className)}>
      <TabNav
        className={styles.tabNav}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <Suspense fallback={<div>Loading Configs...</div>}>
        <TournamentConfig
          className={cn({
            [styles.hidden]: activeTab !== EditorTabs.TOURNAMENT_CONFIG,
          })}
        />
        <PlayerForm
          className={cn({
            [styles.hidden]: activeTab !== EditorTabs.PLAYER_FORM,
          })}
        />
        <ElementEditor
          elements={tournamentLayout?.elements ?? []}
          selectedElementIndex={selectedElementIndex}
          className={cn({
            [styles.hidden]: activeTab !== EditorTabs.ELEMENT_EDITOR,
          })}
        />
        <CanvasConfig
          className={cn({
            [styles.hidden]: activeTab !== EditorTabs.CANVAS_CONFIG,
          })}
        />
      </Suspense>
    </div>
  );
};
