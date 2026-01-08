import { useEffect, useMemo, useState } from "react";
import cn from "classnames";

import { useTemplateDB } from "@/hooks/useConfigDb";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { simpleDesign } from "@/designs/simple";
import { squaresDesign } from "@/designs/squares";
import { TemplatePreview } from "@/components/top8/TemplateEditor/TemplatePreview";
import { Design } from "@/types/top8/Design";
import { Button } from "@/components/shared/Button/Button";
import { DBTemplate } from "@/types/Repository";
import { useCanvasStore } from "@/store/canvasStore";
import { useFontStore } from "@/store/fontStore";
import { useConfirmation } from "@/hooks/useConfirmation";

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
  const { templates, loading, getTemplateWithId } = useTemplateDB();
  const [userDesigns, setUserDesigns] = useState<
    { id: string; design: Design }[]
  >([]);

  const dispatch = useCanvasStore((state) => state.dispatch!);
  const fontDispatch = useFontStore((state) => state.dispatch);

  useEffect(() => {
    const fetchDesigns = async () => {
      const _templates = await Promise.all(
        templates.map((template) => getTemplateWithId(template.id))
      );
      setUserDesigns(
        _templates
          .map((template) => ({ id: template?.id, design: template?.design }))
          .filter((design) => design !== undefined) as {
          id: string;
          design: Design;
        }[]
      );
    };

    fetchDesigns();
  }, [templates, getTemplateWithId]);

  const designs = useMemo(
    () => [...DEFAULT_TEMPLATES, ...userDesigns],
    [userDesigns]
  );

  // const handleCreateNewTemplate = async () => {
  //   const id = await addTemplate({
  //     name: "New Template",
  //     design: layout,
  //     font: selectedFont,
  //   });
  // };

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

  const {
    confirm: confirmTemplateClick,
    ConfirmationDialog: TemplateClickConfirmation,
  } = useConfirmation(handleTemplateClick, {
    title: "Load Template?",
    description: "Your current design and font will be overwritten!",
  });

  if (loading)
    return (
      <div className={cn(className, styles.loading)}>
        <Spinner size={25} />
      </div>
    );

  return (
    <div className={cn(className, styles.templateEditor)}>
      <Button>Create New Template</Button>
      <div className={styles.templates}>
        {designs.map(({ id, design }) => (
          <TemplatePreview
            className={styles.template}
            key={id}
            design={design}
            onClick={() => confirmTemplateClick(id)}
          />
        ))}
      </div>
      <TemplateClickConfirmation />
    </div>
  );
};
