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

export const SidePanel = () => {
  const [activeTab, setActiveTab] = useState<"player-form" | "element-editor">(
    "player-form"
  );

  const handleTabChange = (tab: "player-form" | "element-editor") => {
    setActiveTab(tab);
  };

  return (
    <div className={styles.wrapper}>
      <TabNav.Root size="1">
        <TabNav.Link
          active={activeTab === "player-form"}
          onClick={() => handleTabChange("player-form")}
        >
          Player Form
        </TabNav.Link>
        <TabNav.Link
          active={activeTab === "element-editor"}
          onClick={() => handleTabChange("element-editor")}
        >
          Element Editor
        </TabNav.Link>
      </TabNav.Root>

      <Suspense fallback={<div>Loading Player Form...</div>}>
        <PlayerForm
          className={cn({ [styles.hidden]: activeTab !== "player-form" })}
        />
      </Suspense>
      <Suspense fallback={<div>Loading Element Editor...</div>}>
        <ElementEditor
          className={cn({ [styles.hidden]: activeTab !== "element-editor" })}
        />
      </Suspense>
    </div>
  );
};
