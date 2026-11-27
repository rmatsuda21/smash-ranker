import { useEffect, useMemo, useState } from "react";
import cn from "classnames";
import { FaPlus, FaStar } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";

import { useTemplateDB } from "@/hooks/useConfigDb";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { Button } from "@/components/shared/Button/Button";
import { DBTemplate } from "@/types/Repository";
import { TemplateMode } from "@/types/top8/TemplateCatalog";
import { TEMPLATE_FAMILIES } from "@/consts/top8/templateCatalog";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useFontStore } from "@/store/fontStore";
import {
  TEMPLATE_FILTERS,
  TemplateFilter,
  useTemplateFavoritesStore,
} from "@/store/templateFavoritesStore";
import { logEvent, logWarning } from "@/utils/observability/log";
import { isQuotaError } from "@/utils/safeStorage";
import { useToast } from "@/components/Toast";
import { loadFamily } from "@/utils/fonts/fontLoader";
import { collectDesignFontWeights } from "@/utils/fonts/designWeights";
import { resizePlayerSlots } from "@/utils/top8/playerCount";
import { useConfirmation } from "@/hooks/useConfirmation";
import { CreateTemplateModal } from "@/components/top8/TemplateEditor/CreateTemplateModal/CreateTemplateModal";
import { TemplatePreview } from "@/components/top8/TemplateEditor/TemplatePreview/TemplatePreview";
import {
  FamilyVariant,
  TemplateFamilyCard,
} from "@/components/top8/TemplateEditor/TemplateFamilyCard";
import { EditorPanel } from "@/components/top8/EditorForm/EditorForm";

import styles from "./TemplateEditor.module.scss";

type Props = {
  className?: string;
};

type Family = {
  id: string;
  name: string;
  variants: (FamilyVariant & { mode: TemplateMode })[];
};

const FILTER_LABELS = {
  all: msg`All`,
  singles: msg`Singles`,
  doubles: msg`Doubles`,
  favorites: msg`Favorites`,
  saved: msg`Saved`,
} satisfies Record<TemplateFilter, unknown>;

const modeOf = (template: DBTemplate): TemplateMode =>
  template.design.doubles ? "doubles" : "singles";

export const TemplateEditor = ({ className }: Props) => {
  const { _ } = useLingui();
  const { showToast } = useToast();
  const { templates, loading, getTemplateWithId, addTemplate, deleteTemplate } =
    useTemplateDB();
  const [userTemplates, setUserTemplates] = useState<DBTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(
    null,
  );

  const dispatch = useCanvasStore((state) => state.dispatch);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const selectFont = useFontStore((state) => state.selectFont);
  const favoriteIds = useTemplateFavoritesStore((state) => state.favoriteIds);
  const toggleFavorite = useTemplateFavoritesStore(
    (state) => state.toggleFavorite,
  );
  const removeFavorite = useTemplateFavoritesStore(
    (state) => state.removeFavorite,
  );
  const filter = useTemplateFavoritesStore((state) => state.filter);
  const setFilter = useTemplateFavoritesStore((state) => state.setFilter);
  const storedActiveId = useTemplateFavoritesStore(
    (state) => state.activeTemplateId,
  );
  const setActiveTemplateId = useTemplateFavoritesStore(
    (state) => state.setActiveTemplateId,
  );
  const designName = useCanvasStore((state) => state.design.name);

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

    fetchTemplates().catch((error) =>
      logWarning("saved templates failed to load", {
        area: "storage",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }, [templates, getTemplateWithId]);

  const families = useMemo<Family[]>(
    () =>
      TEMPLATE_FAMILIES.map((family) => ({
        id: family.id,
        name: _(family.name),
        variants: family.variants.map((variant) => {
          const name = _(variant.name);
          const short = variant.short;
          return {
            id: variant.id,
            name,
            label:
              short === undefined
                ? name
                : typeof short === "string"
                  ? short
                  : _(short),
            design: variant.design,
            font: variant.font,
            mode: variant.mode,
            swatch: variant.swatch,
          };
        }),
      })),
    [_],
  );

  // The template the design on the canvas came from: the one loaded last,
  // as long as the design is still that template's. Before anything has
  // been loaded, the built-in the design can only be (the default design).
  const activeTemplateId = useMemo(() => {
    const builtIns = families.flatMap((family) => family.variants);
    const stored = [...builtIns, ...userTemplates].find(
      (template) => template.id === storedActiveId,
    );
    if (stored?.design.name === designName) return stored.id;

    const sameName = builtIns.filter(
      (template) => template.design.name === designName,
    );
    return sameName.length === 1 ? sameName[0].id : undefined;
  }, [families, userTemplates, storedActiveId, designName]);

  const isVisible = (template: DBTemplate) => {
    switch (filter) {
      case "all":
        return true;
      case "favorites":
        return favoriteIds.includes(template.id);
      case "saved":
        return false;
      default:
        return modeOf(template) === filter;
    }
  };

  const visibleUserTemplates = userTemplates.filter(
    (template) => filter === "saved" || isVisible(template),
  );
  const visibleFamilies = families
    .map((family) => ({
      ...family,
      shown: family.variants.filter(isVisible),
    }))
    .filter((family) => family.shown.length > 0);

  const handleToggleFavorite = (id: string) => {
    logEvent("template_favorite", {
      template_id: id,
      is_favorite: !favoriteIds.includes(id),
    });
    toggleFavorite(id);
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate(id);
    } catch (error) {
      logWarning("template delete failed", {
        area: "storage",
        error: error instanceof Error ? error.message : String(error),
      });
      showToast(_(msg`Couldn't delete the template. Try again.`), {
        variant: "error",
      });
      return;
    }
    removeFavorite(id);
    logEvent("template_delete", { surface: "ranker" });
  };

  const loadTemplate = async (id: string) => {
    setLoadingTemplateId(id);

    let template: DBTemplate | undefined;
    const defaultTemplate = families
      .flatMap((family) => family.variants)
      .find((t) => t.id === id);
    if (defaultTemplate) {
      template = defaultTemplate;
    } else {
      template = await getTemplateWithId(id).catch((error) => {
        logWarning("saved template failed to load", {
          area: "storage",
          error: error instanceof Error ? error.message : String(error),
        });
        showToast(_(msg`Couldn't load the template. Try again.`), {
          variant: "error",
        });
        return undefined;
      });
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
      setActiveTemplateId(id);
    }

    setLoadingTemplateId(null);
  };

  const handleCreateTemplate = async (name: string, previewImage?: Blob) => {
    const { design } = useCanvasStore.getState();
    const font = useFontStore.getState().selectedFont;

    try {
      await addTemplate({ name, design, font, previewImage });
    } catch (error) {
      // The modal stays open with what was typed, to try again.
      logWarning("template save failed", {
        area: "storage",
        error: error instanceof Error ? error.message : String(error),
        ...(isQuotaError(error) && { failure_kind: "quota" }),
      });
      showToast(
        isQuotaError(error)
          ? _(
              msg`Storage for Smash Ranker is full in this browser. Remove some saved images, fonts or templates and try again.`,
            )
          : _(msg`Couldn't save the template. Try again.`),
        { variant: "error" },
      );
      return;
    }
    logEvent("template_save", {
      surface: "ranker",
      has_preview: previewImage !== undefined,
    });
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
  } = useConfirmation(handleDeleteTemplate, {
    title: _(msg`Delete Template?`),
    description: _(msg`This template will be permanently deleted.`),
  });

  if (loading)
    return (
      <div className={cn(className, styles.loading)}>
        <Spinner size={25} />
      </div>
    );

  const selectTemplate = (id: string, group: string) => {
    confirmTemplateClick(id);
    logEvent("template_select", {
      surface: "ranker",
      template_id: id,
      template_group: group,
    });
  };

  const hasBothSections =
    visibleUserTemplates.length > 0 && visibleFamilies.length > 0;
  const isEmpty =
    visibleUserTemplates.length === 0 && visibleFamilies.length === 0;

  return (
    <EditorPanel className={className}>
      <div
        className={styles.filters}
        role="radiogroup"
        aria-label={_(msg`Show`)}
      >
        {TEMPLATE_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={filter === value}
            className={cn(styles.filter, {
              [styles.active]: filter === value,
            })}
            onClick={() => setFilter(value)}
          >
            {value === "favorites" && <FaStar size={10} />}
            {_(FILTER_LABELS[value])}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <p className={styles.hint}>
          <Trans>Loading a template replaces your current design.</Trans>
        </p>
        <Button
          size="sm"
          variant="subtle"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <FaPlus size={10} />
          <Trans>Save Design</Trans>
        </Button>
      </div>

      {isEmpty && (
        <p className={styles.emptyHint}>
          {filter === "favorites" ? (
            <Trans>Star a template to keep it here.</Trans>
          ) : (
            <Trans>
              Save your current design as a template to reuse it later.
            </Trans>
          )}
        </p>
      )}

      {visibleUserTemplates.length > 0 && (
        <section className={styles.section}>
          {hasBothSections && (
            <h4 className={styles.sectionTitle}>
              <Trans>My Templates</Trans>
            </h4>
          )}
          <div className={styles.grid}>
            {visibleUserTemplates.map((template) => (
              <TemplatePreview
                key={template.id}
                template={template}
                isActive={template.id === activeTemplateId}
                onClick={() => selectTemplate(template.id, "saved")}
                onDelete={() => confirmDeleteTemplate(template.id)}
                isFavorite={favoriteIds.includes(template.id)}
                onToggleFavorite={() => handleToggleFavorite(template.id)}
                isLoading={loadingTemplateId === template.id}
              />
            ))}
          </div>
        </section>
      )}

      {visibleFamilies.length > 0 && (
        <section className={styles.section}>
          {hasBothSections && (
            <h4 className={styles.sectionTitle}>
              <Trans>Built-in</Trans>
            </h4>
          )}
          <div className={styles.grid}>
            {visibleFamilies.map((family) => (
              <TemplateFamilyCard
                key={family.id}
                name={family.name}
                variants={family.shown}
                hasHiddenVariants={family.shown.length < family.variants.length}
                activeTemplateId={activeTemplateId}
                favoriteIds={favoriteIds}
                onLoad={(id) => selectTemplate(id, family.id)}
                onToggleFavorite={handleToggleFavorite}
                loadingTemplateId={loadingTemplateId}
              />
            ))}
          </div>
        </section>
      )}

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
