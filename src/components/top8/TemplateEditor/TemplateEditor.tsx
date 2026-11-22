import { useEffect, useMemo, useState } from "react";
import cn from "classnames";
import { IoGrid } from "react-icons/io5";
import { FaList, FaPlus } from "react-icons/fa6";
import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";

import { useTemplateDB } from "@/hooks/useConfigDb";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { top8erDesign } from "@/designs/top8er";
import { squaresDesign } from "@/designs/squares";
import { minimalDarkDesign, minimalLightDesign } from "@/designs/minimal";
import { standingsLightDesign, standingsDarkDesign } from "@/designs/standings";
import { comicBookDesign } from "@/designs/comicBook";
import { neonSignDesign } from "@/designs/neonSign";
import { highScoreDesign } from "@/designs/highScore";
import { tapeDesign } from "@/designs/tape";
import { kagaribiDesign } from "@/designs/kagaribi";
import { kagaribi16Design } from "@/designs/kagaribi16";
import { Button } from "@/components/shared/Button/Button";
import { DBTemplate } from "@/types/Repository";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useFontStore } from "@/store/fontStore";
import { loadFamily } from "@/utils/fonts/fontLoader";
import { collectDesignFontWeights } from "@/utils/fonts/designWeights";
import { resizePlayerSlots } from "@/utils/top8/playerCount";
import { useConfirmation } from "@/hooks/useConfirmation";
import { CreateTemplateModal } from "@/components/top8/TemplateEditor/CreateTemplateModal/CreateTemplateModal";
import { TemplateGroup } from "@/components/top8/TemplateEditor/TemplateGroup";
import { EditorPanel } from "@/components/top8/EditorForm/EditorForm";

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
    id: "standings",
    name: msg`Standings`,
    templates: [
      {
        id: "standings-dark",
        name: msg`Dark`,
        design: standingsDarkDesign,
        font: "Noto Sans JP",
      },
      {
        id: "standings-light",
        name: msg`Light`,
        design: standingsLightDesign,
        font: "Noto Sans JP",
      },
    ],
  },
  {
    id: "comic-book",
    name: msg`Comic Book`,
    templates: [
      {
        id: "comic-book",
        name: msg`Original`,
        design: comicBookDesign,
        font: "Dela Gothic One",
      },
    ],
  },
  {
    id: "neon-sign",
    name: msg`Neon Sign`,
    templates: [
      {
        id: "neon-sign",
        name: msg`Original`,
        design: neonSignDesign,
        font: "M PLUS Rounded 1c",
      },
    ],
  },
  {
    id: "high-score",
    name: msg`High Score`,
    templates: [
      {
        id: "high-score",
        name: msg`Original`,
        design: highScoreDesign,
        font: "DotGothic16",
      },
    ],
  },
  {
    id: "tape",
    name: msg`Tape`,
    templates: [
      {
        id: "tape",
        name: msg`Original`,
        design: tapeDesign,
        font: "Dela Gothic One",
      },
    ],
  },
  {
    id: "minimal",
    name: msg`Minimal`,
    templates: [
      {
        id: "minimal-dark",
        name: msg`Dark`,
        design: minimalDarkDesign,
        font: "Noto Sans JP",
      },
      {
        id: "minimal-light",
        name: msg`Light`,
        design: minimalLightDesign,
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
      // Fetch the weights this template draws with before applying it. The
      // canvas only gates on font *family* changes, so a template that keeps
      // the family but needs a new weight would otherwise paint and measure
      // with fallback metrics.
      await loadFamily(
        template.font,
        collectDesignFontWeights(template.design),
      ).catch(() => {
        /* apply the template anyway; the canvas falls back gracefully */
      });
      // Skip history for font change since SET_DESIGN will clear history anyway
      await selectFont(template.font, true);
      // A built-in template whose player count is adjustable keeps the count
      // the user already chose, so switching between its variants (light to
      // dark) doesn't drop rows. A saved template keeps the count it was
      // saved with.
      const current = useCanvasStore.getState().design;
      const design =
        defaultTemplate && current.dynamicPlayerCount
          ? resizePlayerSlots(template.design, current.players.length)
          : template.design;
      dispatch({ type: "SET_DESIGN", payload: design });
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

  const {
    confirm: confirmTemplateClick,
    confirmationDialog: templateClickConfirmation,
  } = useConfirmation(loadTemplate, {
    title: _(msg`Load Template?`),
    description: _(msg`Your current design will be overwritten!`),
  });

  const {
    confirm: confirmDeleteTemplate,
    confirmationDialog: deleteTemplateConfirmation,
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

  const viewModes = [
    { mode: "list", label: _(msg`List view`), icon: <FaList /> },
    { mode: "grid", label: _(msg`Grid view`), icon: <IoGrid /> },
  ] as const;

  return (
    <EditorPanel className={className}>
      <div className={styles.toolbar}>
        <p className={styles.hint}>
          <Trans>Loading a template replaces your current design.</Trans>
        </p>
        <div
          className={styles.viewMode}
          role="group"
          aria-label={_(msg`Layout`)}
        >
          {viewModes.map(({ mode, label, icon }) => (
            <button
              key={mode}
              type="button"
              className={cn({ [styles.active]: viewMode === mode })}
              aria-label={label}
              aria-pressed={viewMode === mode}
              onClick={() => setViewMode(mode)}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <TemplateGroup
        templates={userTemplates}
        name={_(msg`My Templates`)}
        onTemplateClick={confirmTemplateClick}
        onDeleteTemplate={confirmDeleteTemplate}
        viewMode={viewMode}
        loadingTemplateId={loadingTemplateId}
        action={
          <Button
            size="sm"
            variant="subtle"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <FaPlus size={10} />
            <Trans>Save Design</Trans>
          </Button>
        }
        emptyHint={
          <Trans>
            Save your current design as a template to reuse it later.
          </Trans>
        }
      />
      {templateGroups.map((group) => (
        <TemplateGroup
          key={group.id}
          templates={group.templates}
          name={group.name}
          onTemplateClick={confirmTemplateClick}
          viewMode={viewMode}
          loadingTemplateId={loadingTemplateId}
        />
      ))}
      {templateClickConfirmation}
      {deleteTemplateConfirmation}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        createTemplate={handleCreateTemplate}
      />
    </EditorPanel>
  );
};
