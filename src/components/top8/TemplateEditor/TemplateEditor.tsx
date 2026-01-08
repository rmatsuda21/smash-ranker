import { useEffect, useMemo, useState } from "react";
import cn from "classnames";

import { useTemplateDB } from "@/hooks/useConfigDb";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { simpleDesign } from "@/designs/simple";
import { squaresDesign } from "@/designs/squares";
import { TemplatePreview } from "@/components/top8/TemplateEditor/TemplatePreview/TemplatePreview";
import { Button } from "@/components/shared/Button/Button";
import { DBTemplate } from "@/types/Repository";
import { useCanvasStore } from "@/store/canvasStore";
import { useFontStore } from "@/store/fontStore";
import { useConfirmation } from "@/hooks/useConfirmation";
import { CreateTemplateModal } from "@/components/top8/TemplateEditor/CreateTemplateModal/CreateTemplateModal";

import styles from "./TemplateEditor.module.scss";

type Props = {
  className?: string;
};

const DEFAULT_TEMPLATES: DBTemplate[] = [
  { id: "top8er", name: "Top8er", design: simpleDesign, font: "Noto Sans JP" },
  {
    id: "top8er-squares",
    name: "Top8er (Square Variant)",
    design: squaresDesign,
    font: "Noto Sans JP",
  },
];

export const TemplateEditor = ({ className }: Props) => {
  const { templates, loading, getTemplateWithId, addTemplate } =
    useTemplateDB();
  const [userTemplates, setUserTemplates] = useState<DBTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const dispatch = useCanvasStore((state) => state.dispatch!);
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

  const designs = useMemo(
    () => [...DEFAULT_TEMPLATES, ...userTemplates],
    [userTemplates]
  );

  const handleTemplateClick = async (id: string) => {
    let template: DBTemplate | undefined;
    if (DEFAULT_TEMPLATES.some((template) => template.id === id)) {
      template = DEFAULT_TEMPLATES.find((template) => template.id === id)!;
    } else {
      template = await getTemplateWithId(id);
    }

    if (template) {
      dispatch({ type: "SET_DESIGN", payload: template.design });
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
  } = useConfirmation(handleTemplateClick, {
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
      <Button onClick={() => setIsCreateModalOpen(true)}>
        Create New Template
      </Button>
      <div className={styles.templates}>
        {designs.map((template) => (
          <TemplatePreview
            className={styles.template}
            key={template.id}
            template={template}
            onClick={() => confirmTemplateClick(template.id)}
          />
        ))}
      </div>
      <TemplateClickConfirmation />
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        createTemplate={handleCreateTemplate}
      />
    </div>
  );
};
