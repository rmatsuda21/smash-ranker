import { Suspense, lazy } from "react";
import cn from "classnames";

import { EditorTab, EditorTabLabels } from "@/types/top8/Editor";
import { useEditorStore } from "@/store/editorStore";
import { TabNav } from "@/components/shared/TabNav/TabNav";

import styles from "./SidePanel.module.scss";

// const PlayerElementEditor = lazy(() =>
//   import("@/components/top8/PlayerElementEditor/PlayerElementEditor").then(
//     (module) => ({
//       default: module.PlayerElementEditor,
//     })
//   )
// );

// const ElementPanel = lazy(() =>
//   import("@/components/top8/SidePanel/ElementPanel").then((module) => ({
//     default: module.ElementPanel,
//   }))
// );

const PlayersEditor = lazy(() =>
  import("@/components/top8/PlayersEditor/PlayersEditor").then((module) => ({
    default: module.PlayersEditor,
  }))
);

const DesignEditor = lazy(() =>
  import("@/components/top8/DesignEditor/DesignEditor").then((module) => ({
    default: module.DesignEditor,
  }))
);

const TournamentEditor = lazy(() =>
  import("@/components/top8/TournamentConfig/TournamentEditor").then(
    (module) => ({
      default: module.TournamentEditor,
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
        <TournamentEditor
          className={cn({
            [styles.hidden]: activeTab !== EditorTab.TOURNAMENT,
          })}
        />
        <DesignEditor
          className={cn({
            [styles.hidden]: activeTab !== EditorTab.DESIGN,
          })}
        />
        <PlayersEditor
          className={cn({
            [styles.hidden]: activeTab !== EditorTab.PLAYERS,
          })}
        />
        {/* <PlayerElementEditor
          className={cn({
            [styles.hidden]: activeTab !== EditorTab.PLAYER_EDITOR,
          })}
        />
        <ElementPanel
          className={cn({
            [styles.hidden]: activeTab !== EditorTab.ELEMENT_EDITOR,
          })}
        /> */}
      </Suspense>
    </div>
  );
};
