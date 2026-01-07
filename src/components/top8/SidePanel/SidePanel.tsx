import { Suspense, lazy } from "react";
import { FaCaretLeft } from "react-icons/fa6";
import cn from "classnames";

import { EditorTab } from "@/types/top8/Editor";
import { useEditorStore } from "@/store/editorStore";
import { SidePanelNav } from "@/components/top8/SidePanel/SidePanelNav";

import styles from "./SidePanel.module.scss";

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

const TextEditor = lazy(() =>
  import("@/components/top8/TextEditor/TextEditor").then((module) => ({
    default: module.TextEditor,
  }))
);

const TemplateEditor = lazy(() =>
  import("@/components/top8/TemplateEditor/TemplateEditor").then((module) => ({
    default: module.TemplateEditor,
  }))
);

type Props = {
  className?: string;
};

export const SidePanel = ({ className }: Props) => {
  const activeTab = useEditorStore((state) => state.activeTab);
  const dispatch = useEditorStore((state) => state.dispatch);
  const isSidePanelOpen = useEditorStore((state) => state.isSidePanelOpen);

  const handleTabChange = (tab: EditorTab) => {
    if (activeTab === tab) {
      dispatch({ type: "CLOSE_SIDE_PANEL" });
      return;
    }

    dispatch({ type: "SET_ACTIVE_TAB", payload: tab });
    dispatch({ type: "SET_IS_SIDE_PANEL_OPEN", payload: true });
  };

  const handleClose = () => {
    dispatch({ type: "CLOSE_SIDE_PANEL" });
  };

  return (
    <div
      className={cn(className, styles.sidePanel, {
        [styles.closed]: !isSidePanelOpen,
      })}
    >
      <SidePanelNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className={styles.nav}
      />

      <div className={styles.editorsWindow}>
        <div className={styles.editors}>
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
            <TextEditor
              className={cn({
                [styles.hidden]: activeTab !== EditorTab.TEXTS,
              })}
            />
            <TemplateEditor
              className={cn({
                [styles.hidden]: activeTab !== EditorTab.TEMPLATES,
              })}
            />
          </Suspense>
        </div>
        <button className={styles.close} onClick={handleClose}>
          <FaCaretLeft className={styles.icon} />
        </button>
      </div>
    </div>
  );
};
