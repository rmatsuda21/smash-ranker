import { useEffect, useState } from "react";
import cn from "classnames";
import { IoGrid } from "react-icons/io5";
import { FaList } from "react-icons/fa6";

import { useTemplateDB } from "@/hooks/useConfigDb";
import { minimal4Design } from "@/designs/minimal_4";
import { minimal16Design } from "@/designs/minimal_16";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { top8erDesign } from "@/designs/top8er";
import { squaresDesign } from "@/designs/squares";
import { minimalDesign } from "@/designs/minimal";
import { Button } from "@/components/shared/Button/Button";
import { DBTemplate } from "@/types/Repository";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useFontStore } from "@/store/fontStore";
import { useConfirmation } from "@/hooks/useConfirmation";
import { CreateTemplateModal } from "@/components/top8/TemplateEditor/CreateTemplateModal/CreateTemplateModal";
import { TemplateGroup } from "@/components/top8/TemplateEditor/TemplateGroup";

import styles from "./TemplateEditor.module.scss";

type Props = {
  className?: string;
};

const DEFAULT_TEMPLATE_GROUPS: { templates: DBTemplate[]; name: string }[] = [
  {
    name: "Top8er",
    templates: [
      {
        id: "top8er",
        name: "Top8er",
        design: top8erDesign,
        font: "Noto Sans JP",
      },
      {
        id: "top8er-squares",
        name: "Top8er (Square Variant)",
        design: squaresDesign,
        font: "Noto Sans JP",
      },
    ],
  },
  {
    name: "Minimal",
    templates: [
      {
        id: "minimal",
        name: "Minimal",
        design: minimalDesign,
        font: "Noto Sans JP",
      },
      {
        id: "minimal-4",
        name: "Minimal (4 Players)",
        design: minimal4Design,
        font: "Noto Sans JP",
      },
      {
        id: "minimal-16",
        name: "Minimal (16 Players)",
        design: minimal16Design,
        font: "Noto Sans JP",
      },
    ],
  },
];

export const TemplateEditor = ({ className }: Props) => {
  const { templates, loading, getTemplateWithId, addTemplate } =
    useTemplateDB();
  const [userTemplates, setUserTemplates] = useState<DBTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const dispatch = useCanvasStore((state) => state.dispatch);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const fontDispatch = useFontStore((state) => state.dispatch);

  useEffect(() => {
    const fetchTemplates = async () => {
      const _templates = await Promise.all(
        templates.map((template) => getTemplateWithId(template.id))
      );
      setUserTemplates(
        _templates
          .map((template) => template)
          .filter((template) => template !== undefined) as DBTemplate[]
      );
    };

    fetchTemplates();
  }, [templates, getTemplateWithId]);

  const loadTemplate = async (id: string) => {
    let template: DBTemplate | undefined;
    if (
      DEFAULT_TEMPLATE_GROUPS.some((group) =>
        group.templates.some((template) => template.id === id)
      )
    ) {
      template = DEFAULT_TEMPLATE_GROUPS.find((group) =>
        group.templates.some((template) => template.id === id)
      )!.templates.find((template) => template.id === id)!;
    } else {
      template = await getTemplateWithId(id);
    }

    if (template) {
      dispatch({ type: "SET_DESIGN", payload: template.design });
      playerDispatch({ type: "CLEAR_SELECTED_PLAYER" });
      fontDispatch({
        type: "SET_SELECTED_FONT",
        payload: template.font,
      });
    }
  };

  const handleCreateTemplate = (name: string) => {
    addTemplate({
      name,
      design: useCanvasStore.getState().design,
      font: useFontStore.getState().selectedFont,
    }).then(() => {
      setIsCreateModalOpen(false);
    });
  };

  const {
    confirm: confirmTemplateClick,
    ConfirmationDialog: TemplateClickConfirmation,
  } = useConfirmation(loadTemplate, {
    title: "Load Template?",
    description: "Your current design will be overwritten!",
  });

  if (loading)
    return (
      <div className={cn(className, styles.loading)}>
        <Spinner size={25} />
      </div>
    );

  return (
    <div className={cn(className, styles.templateEditor)}>
      <div className={styles.header}>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create New Template
        </Button>

        <div className={styles.viewMode}>
          <Button
            size="sm"
            variant={viewMode === "list" ? "solid" : "ghost"}
            onClick={() => setViewMode("list")}
          >
            <FaList />
          </Button>
          <Button
            size="sm"
            variant={viewMode === "grid" ? "solid" : "ghost"}
            onClick={() => setViewMode("grid")}
          >
            <IoGrid />
          </Button>
        </div>
      </div>
      {DEFAULT_TEMPLATE_GROUPS.map((group) => (
        <TemplateGroup
          key={group.name}
          templates={group.templates}
          name={group.name}
          onTemplateClick={confirmTemplateClick}
          viewMode={viewMode}
        />
      ))}
      {userTemplates.length > 0 && (
        <TemplateGroup
          templates={userTemplates}
          name="My Templates"
          onTemplateClick={confirmTemplateClick}
          viewMode={viewMode}
        />
      )}
      <TemplateClickConfirmation />
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        createTemplate={handleCreateTemplate}
      />
    </div>
  );
};
