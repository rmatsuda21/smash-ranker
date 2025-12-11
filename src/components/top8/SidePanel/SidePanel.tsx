import { Suspense, lazy } from "react";
import cn from "classnames";

import {
  EditorTab,
  EditorTabLabels,
  EditorTabs,
} from "@/types/top8/EditorTypes";
import { useEditorStore } from "@/store/editorStore";
import { TabNav } from "@/components/shared/TabNav/TabNav";

import styles from "./SidePanel.module.scss";

const PlayerElementEditor = lazy(() =>
  import("@/components/top8/PlayerElementEditor/PlayerElementEditor").then(
    (module) => ({
      default: module.PlayerElementEditor,
    })
  )
);

const PlayerForm = lazy(() =>
  import("@/components/top8/PlayerForm/PlayerForm").then((module) => ({
    default: module.PlayerForm,
  }))
);

const ElementPanel = lazy(() =>
  import("@/components/top8/SidePanel/ElementPanel").then((module) => ({
    default: module.ElementPanel,
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

export const SidePanel = ({ className }: Props) => {
  const activeTab = useEditorStore((state) => state.activeTab);
  const dispatch = useEditorStore((state) => state.dispatch);

  const handleTabChange = (tab: EditorTab) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: tab });
  };

  return (
    <div className={cn(styles.wrapper, className)}>
      <TabNav
        className={styles.tabNav}
        tabs={EditorTabLabels}
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
        <PlayerElementEditor
          className={cn({
            [styles.hidden]: activeTab !== EditorTabs.PLAYER_EDITOR,
          })}
        />
        <ElementPanel
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
