import { useEffect, useState } from "react";
import cn from "classnames";
import { IoGrid } from "react-icons/io5";
import { FaList } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";

import { useTemplateDB } from "@/hooks/useConfigDb";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { top8erDesign } from "@/designs/top8er";
import { squaresDesign } from "@/designs/squares";
import {
  minimalDesign,
  minimal4Design,
  minimal16Design,
  minimal24Design,
  createMinimalDesign,
} from "@/designs/minimal";
import { kagaribiDesign } from "@/designs/kagaribi";
import { Button } from "@/components/shared/Button/Button";
import { DBTemplate } from "@/types/Repository";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useFontStore } from "@/store/fontStore";
import { useConfirmation } from "@/hooks/useConfirmation";
import { CreateTemplateModal } from "@/components/top8/TemplateEditor/CreateTemplateModal/CreateTemplateModal";
import { CreateMinimalTemplateModal } from "@/components/top8/TemplateEditor/CreateMinimalTemplateModal/CreateMinimalTemplateModal";
import { TemplateGroup } from "@/components/top8/TemplateEditor/TemplateGroup";

import styles from "./TemplateEditor.module.scss";

type Props = {
  className?: string;
};

const DEFAULT_TEMPLATE_GROUPS: { templates: DBTemplate[]; name: string }[] = [
  {
    name: "Kagaribi",
    templates: [
      {
        id: "kagaribi",
        name: "Kagaribi",
        design: kagaribiDesign,
        font: "Dela Gothic One",
      },
    ],
  },
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
      {
        id: "minimal-24",
        name: "Minimal (24 Players)",
        design: minimal24Design,
        font: "Noto Sans JP",
      },
    ],
  },
];

export const TemplateEditor = ({ className }: Props) => {
  const { _ } = useLingui();
  const { templates, loading, getTemplateWithId, addTemplate, deleteTemplate } =
    useTemplateDB();
  const [userTemplates, setUserTemplates] = useState<DBTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateMinimalModalOpen, setIsCreateMinimalModalOpen] =
    useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(
    null
  );

  const dispatch = useCanvasStore((state) => state.dispatch);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const selectFont = useFontStore((state) => state.selectFont);

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
    setLoadingTemplateId(id);

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
      // Skip history for font change since SET_DESIGN will clear history anyway
      await selectFont(template.font, true);
      dispatch({ type: "SET_DESIGN", payload: template.design });
      playerDispatch({ type: "CLEAR_SELECTED_PLAYER" });
    }

    setLoadingTemplateId(null);
  };

  const handleCreateTemplate = async (name: string) => {
    const { design, stageRef } = useCanvasStore.getState();
    const font = useFontStore.getState().selectedFont;

    let previewImage: Blob | undefined;
    if (stageRef) {
      try {
        const canvas = stageRef.toCanvas({ pixelRatio: 0.25 });
        previewImage = await new Promise<Blob | undefined>((resolve) => {
          canvas.toBlob(
            (blob) => {
              canvas.width = 0;
              canvas.height = 0;
              resolve(blob ?? undefined);
            },
            "image/webp",
            0.5
          );
        });
      } catch {
        // Preview capture failed — save template without preview
      }
    }

    await addTemplate({ name, design, font, previewImage });
    setIsCreateModalOpen(false);
  };

  const handleCreateMinimalTemplate = (name: string, playerCount: number) => {
    addTemplate({
      name,
      design: createMinimalDesign(playerCount),
      font: "Noto Sans JP",
    }).then(() => {
      setIsCreateMinimalModalOpen(false);
    });
  };

  const {
    confirm: confirmTemplateClick,
    ConfirmationDialog: TemplateClickConfirmation,
  } = useConfirmation(loadTemplate, {
    title: _(msg`Load Template?`),
    description: _(msg`Your current design will be overwritten!`),
  });

  const {
    confirm: confirmDeleteTemplate,
    ConfirmationDialog: DeleteTemplateConfirmation,
  } = useConfirmation(deleteTemplate, {
    title: _(msg`Delete Template?`),
    description: _(msg`This template will be permanently deleted.`),
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
          <Trans>Create New Template</Trans>
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
          loadingTemplateId={loadingTemplateId}
          onCreateCustom={
            group.name === "Minimal"
              ? () => setIsCreateMinimalModalOpen(true)
              : undefined
          }
        />
      ))}
      {userTemplates.length > 0 && (
        <TemplateGroup
          templates={userTemplates}
          name={_(msg`My Templates`)}
          onTemplateClick={confirmTemplateClick}
          onDeleteTemplate={confirmDeleteTemplate}
          viewMode={viewMode}
          loadingTemplateId={loadingTemplateId}
        />
      )}
      <TemplateClickConfirmation />
      <DeleteTemplateConfirmation />
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        createTemplate={handleCreateTemplate}
      />
      <CreateMinimalTemplateModal
        isOpen={isCreateMinimalModalOpen}
        onClose={() => setIsCreateMinimalModalOpen(false)}
        createTemplate={handleCreateMinimalTemplate}
      />
    </div>
  );
};
