import { useState, useEffect, useCallback } from "react";

import { DBTemplate } from "@/types/Repository";
import { previewCache } from "@/db/previewCache";
import { templateRepository } from "@/db/repository";
import { logWarning } from "@/utils/observability/log";
import { requestPersistentStorage } from "@/utils/persistentStorage";

export const useTemplateDB = () => {
  const [templates, setTemplates] = useState<DBTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setTemplates(await templateRepository.getAll());
  };

  useEffect(() => {
    // Saved templates are unavailable (storage blocked or broken): the
    // built-in ones still show, and a save reports its own failure.
    refresh()
      .catch((error) =>
        logWarning("saved templates failed to load", {
          area: "storage",
          error: error instanceof Error ? error.message : String(error),
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const addTemplate = useCallback(async (config: Omit<DBTemplate, "id">) => {
    const id = crypto.randomUUID();
    await templateRepository.put({
      id,
      ...config,
    });
    requestPersistentStorage();
    await refresh();
    return id;
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    await templateRepository.delete(id);
    void previewCache.delete(id);
    await refresh();
  }, []);

  const clearAll = useCallback(async () => {
    await templateRepository.clear();
    void previewCache.clear().catch(() => {});
    await refresh();
  }, []);

  const getTemplateWithId = useCallback(async (id: string) => {
    return await templateRepository.get(id);
  }, []);

  return {
    templates,
    loading,
    addTemplate,
    deleteTemplate,
    clearAll,
    getTemplateWithId,
  };
};
