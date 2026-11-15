import { useCallback, useEffect, useMemo, useState } from "react";
import { FaFloppyDisk, FaTrash } from "react-icons/fa6";

import { useThumbnailStore } from "@/store/thumbnailStore";
import { useThumbnailEditorStore } from "@/store/thumbnailEditorStore";
import { useFontStore } from "@/store/fontStore";
import { thumbnailTemplateRepository } from "@/db/repository";
import { DBThumbnailTemplate } from "@/types/Repository";
import { BUILT_IN_TEMPLATES, BuiltInTemplate } from "@/thumbnails";
import { stageToBlob } from "@/utils/thumbnail/exportPng";
import { uuid } from "@/utils/thumbnail/uuid";
import { ThumbnailDesign } from "@/types/thumbnail/ThumbnailDesign";
import { PREVIEW_PIXEL_RATIO } from "@/consts/thumbnail/defaults";
import { ensureFontsLoaded } from "@/utils/thumbnail/ensureFontsLoaded";
import { Card } from "@/components/shared/Card/Card";
import { ConfirmationModal } from "@/components/shared/ConfirmationModal/ConfirmationModal";
import { Input } from "@/components/shared/Input/Input";
import { useConfirmation } from "@/hooks/useConfirmation";

import { BuiltInTemplatePreview } from "./BuiltInTemplatePreview";

import styles from "./TemplatesTab.module.scss";

// Module-level cache so we only render each built-in template's hidden Konva
// stage once per page lifetime, regardless of how many times the Templates
// tab is opened.
const builtInPreviewCache = new Map<string, string>();

export const TemplatesTab = () => {
  const stage = useThumbnailEditorStore((s) => s.stage);
  const dispatch = useThumbnailStore((s) => s.dispatch);
  const design = useThumbnailStore((s) => s.design);
  const clearSelection = useThumbnailEditorStore((s) => s.clearSelection);
  const selectedFont = useFontStore((s) => s.selectedFont);
  const [saved, setSaved] = useState<DBThumbnailTemplate[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [builtInPreviews, setBuiltInPreviews] = useState<
    Record<string, string>
  >(() => Object.fromEntries(builtInPreviewCache));
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const templatesNeedingPreview = useMemo<
    Array<{ template: BuiltInTemplate; design: ThumbnailDesign }>
  >(
    () =>
      BUILT_IN_TEMPLATES.filter((t) => !builtInPreviewCache.has(t.id)).map(
        (t) => ({ template: t, design: t.build() }),
      ),
    [],
  );

  const handlePreviewCapture = useCallback((id: string, url: string) => {
    builtInPreviewCache.set(id, url);
    setBuiltInPreviews((prev) =>
      prev[id] === url ? prev : { ...prev, [id]: url },
    );
  }, []);

  const refresh = useCallback(async () => {
    const all = await thumbnailTemplateRepository.getAll();
    setSaved(all);
    const previewMap: Record<string, string> = {};
    for (const t of all) {
      if (t.previewImage) {
        previewMap[t.id] = URL.createObjectURL(t.previewImage);
      }
    }
    setPreviews((prev) => {
      Object.values(prev).forEach((u) => URL.revokeObjectURL(u));
      return previewMap;
    });
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      setPreviews((prev) => {
        Object.values(prev).forEach((u) => URL.revokeObjectURL(u));
        return {};
      });
    };
  }, [refresh]);

  const loadDesign = (next: ThumbnailDesign) => {
    clearSelection();
    dispatch({ type: "LOAD_DESIGN", payload: next });
    // Make sure every font referenced by the loaded design is fetched. We
    // intentionally don't touch the global selectedFont so that switching
    // templates won't shuffle fonts in OTHER text elements.
    void ensureFontsLoaded(next);
  };

  const openSaveDialog = () => {
    setSaveName(design.name || "Template");
    setIsSaveOpen(true);
  };

  const handleSaveCurrent = async () => {
    const name = saveName.trim();
    if (!name) return;
    setIsSaveOpen(false);
    let preview: Blob | undefined;
    if (stage) {
      preview = (await stageToBlob(stage, PREVIEW_PIXEL_RATIO)) ?? undefined;
    }
    const entry: DBThumbnailTemplate = {
      id: uuid(),
      name,
      design: { ...design, name },
      font: selectedFont,
      date: new Date(),
      previewImage: preview,
    };
    await thumbnailTemplateRepository.put(entry);
    refresh();
  };

  const { confirm: confirmDelete, confirmationDialog: deleteConfirmation } =
    useConfirmation(
      async (id: string) => {
        await thumbnailTemplateRepository.delete(id);
        refresh();
      },
      {
        title: "Delete this template?",
        description: "This template will be permanently deleted.",
      },
    );

  return (
    <div>
      <div className={styles.section}>
        <h4>
          Built-in
          <button className={styles.saveBtn} onClick={openSaveDialog}>
            <FaFloppyDisk /> Save current
          </button>
        </h4>
        <div className={styles.grid}>
          {BUILT_IN_TEMPLATES.map((tmpl) => (
            <Card
              key={tmpl.id}
              variant="interactive"
              className={styles.card}
              onClick={() => loadDesign(tmpl.build())}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  loadDesign(tmpl.build());
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className={styles.preview}>
                {builtInPreviews[tmpl.id] ? (
                  <img src={builtInPreviews[tmpl.id]} alt={tmpl.name} />
                ) : null}
              </div>
              <div className={styles.name}>{tmpl.name}</div>
            </Card>
          ))}
        </div>
        {templatesNeedingPreview.map(({ template, design }) => (
          <BuiltInTemplatePreview
            key={template.id}
            design={design}
            onCapture={(url) => handlePreviewCapture(template.id, url)}
          />
        ))}
      </div>
      <div className={styles.section}>
        <h4>Saved</h4>
        {saved.length === 0 ? (
          <div className={styles.empty}>
            No saved templates yet. Save your current design above.
          </div>
        ) : (
          <div className={styles.grid}>
            {saved.map((tmpl) => (
              <Card
                key={tmpl.id}
                variant="interactive"
                className={styles.card}
                onClick={() => loadDesign(tmpl.design)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    loadDesign(tmpl.design);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className={styles.preview}>
                  {previews[tmpl.id] ? (
                    <img src={previews[tmpl.id]} alt={tmpl.name} />
                  ) : null}
                </div>
                <div className={styles.name}>{tmpl.name}</div>
                <button
                  type="button"
                  className={styles.delete}
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(tmpl.id);
                  }}
                  aria-label="Delete"
                >
                  <FaTrash size={10} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={isSaveOpen}
        onClose={() => setIsSaveOpen(false)}
        onCancel={() => setIsSaveOpen(false)}
        onConfirm={handleSaveCurrent}
        title="Save template"
        description="Save the current design as a reusable template."
      >
        <Input
          id="thumbnail-template-name"
          label="Template name"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onKeyDown={(e) => {
            // Ignore the Enter that commits an IME composition.
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSaveCurrent();
            }
          }}
          autoFocus
        />
      </ConfirmationModal>
      {deleteConfirmation}
    </div>
  );
};
