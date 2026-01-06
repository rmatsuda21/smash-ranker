import { useState, useEffect, useCallback } from "react";

import { DBTemplate } from "@/types/Repository";
import { templateRepository } from "@/db/repository";

export const useTemplateDB = () => {
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setTemplates(
      await templateRepository
        .getAll()
        .then((configs) =>
          configs.map((config) => ({ id: config.id, name: config.name }))
        )
    );
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const addTemplate = useCallback(async (config: Omit<DBTemplate, "id">) => {
    const id = crypto.randomUUID();
    await templateRepository.put({
      id,
      ...config,
    });
    await refresh();
    return id;
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    await templateRepository.delete(id);
    await refresh();
  }, []);

  const clearAll = useCallback(async () => {
    await templateRepository.clear();
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
