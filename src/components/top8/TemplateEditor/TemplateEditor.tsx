import { useEffect, useMemo, useState } from "react";
import cn from "classnames";
import { IoGrid } from "react-icons/io5";
import { FaList } from "react-icons/fa6";
import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";

import { useTemplateDB } from "@/hooks/useConfigDb";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { top8erDesign } from "@/designs/top8er";
import { squaresDesign } from "@/designs/squares";
import {
  minimalDarkDesign,
  minimal4DarkDesign,
  minimalLightDesign,
  minimal4LightDesign,
  createMinimalDesign,
  type MinimalTheme,
} from "@/designs/minimal";
import { kagaribiDesign } from "@/designs/kagaribi";
import { kagaribi16Design } from "@/designs/kagaribi16";
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

type DefaultTemplate = Omit<DBTemplate, "name"> & { name: MessageDescriptor };

type DefaultTemplateGroup = {
  id: string;
  name: MessageDescriptor;
  templates: DefaultTemplate[];
};

const DEFAULT_TEMPLATE_GROUPS: DefaultTemplateGroup[] = [
  {
    id: "kagaribi",
    name: msg`Kagaribi`,
    templates: [
      {
        id: "kagaribi",
        name: msg`Original`,
        design: kagaribiDesign,
        font: "Dela Gothic One",
      },
      {
        id: "kagaribi-16",
        name: msg`16 Player Variant`,
        design: kagaribi16Design,
        font: "Dela Gothic One",
      },
    ],
  },
  {
    id: "top8er",
    name: msg`Top8er`,
    templates: [
      {
        id: "top8er",
        name: msg`Original`,
        design: top8erDesign,
        font: "Noto Sans JP",
      },
      {
        id: "top8er-squares",
        name: msg`Square Variant`,
        design: squaresDesign,
        font: "Noto Sans JP",
      },
    ],
  },
  {
    id: "minimal",
    name: msg`Minimal`,
    templates: [
      {
        id: "minimal-dark",
        name: msg`8 Players (Dark)`,
        design: minimalDarkDesign,
        font: "Noto Sans JP",
      },
      {
        id: "minimal-4-dark",
        name: msg`4 Players (Dark)`,
        design: minimal4DarkDesign,
        font: "Noto Sans JP",
      },
      {
        id: "minimal-light",
        name: msg`8 Players (Light)`,
        design: minimalLightDesign,
        font: "Noto Sans JP",
      },
      {
        id: "minimal-4-light",
        name: msg`4 Players (Light)`,
        design: minimal4LightDesign,
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
    null,
  );

  const dispatch = useCanvasStore((state) => state.dispatch);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const selectFont = useFontStore((state) => state.selectFont);

  useEffect(() => {
    const fetchTemplates = async () => {
      const _templates = await Promise.all(
        templates.map((template) => getTemplateWithId(template.id)),
      );
      setUserTemplates(
        _templates
          .map((template) => template)
          .filter((template) => template !== undefined) as DBTemplate[],
      );
    };

    fetchTemplates();
  }, [templates, getTemplateWithId]);

  const templateGroups = useMemo(
    () =>
      DEFAULT_TEMPLATE_GROUPS.map((group) => ({
        id: group.id,
        name: _(group.name),
        templates: group.templates.map<DBTemplate>((template) => ({
          ...template,
          name: _(template.name),
        })),
      })),
    [_],
  );

  const loadTemplate = async (id: string) => {
    setLoadingTemplateId(id);

    let template: DBTemplate | undefined;
    const defaultTemplate = templateGroups
      .flatMap((group) => group.templates)
      .find((t) => t.id === id);
    if (defaultTemplate) {
      template = defaultTemplate;
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

  const handleCreateTemplate = async (name: string, previewImage?: Blob) => {
    const { design } = useCanvasStore.getState();
    const font = useFontStore.getState().selectedFont;

    await addTemplate({ name, design, font, previewImage });
    setIsCreateModalOpen(false);
  };

  const handleCreateMinimalTemplate = (
    name: string,
    playerCount: number,
    theme: MinimalTheme,
  ) => {
    addTemplate({
      name,
      design: createMinimalDesign(playerCount, theme),
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
      {templateGroups.map((group) => (
        <TemplateGroup
          key={group.id}
          templates={group.templates}
          name={group.name}
          onTemplateClick={confirmTemplateClick}
          viewMode={viewMode}
          loadingTemplateId={loadingTemplateId}
          onCreateCustom={
            group.id === "minimal"
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
