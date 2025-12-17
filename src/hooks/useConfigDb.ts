import { useState, useEffect } from "react";

import { DBConfig } from "@/types/ConfigRepository";
import { configRepository } from "@/db/repository";

export const useConfigDB = () => {
  const [configs, setConfigs] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setConfigs(
      await configRepository
        .getAll()
        .then((configs) =>
          configs.map((config) => ({ id: config.id, name: config.name }))
        )
    );
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const addConfig = async (config: Omit<DBConfig, "id">) => {
    await configRepository.put({
      id: crypto.randomUUID(),
      ...config,
    });
    await refresh();
  };

  const deleteConfig = async (id: string) => {
    await configRepository.delete(id);
    await refresh();
  };

  const clearAll = async () => {
    await configRepository.clear();
    await refresh();
  };

  return { configs, loading, addConfig, deleteConfig, clearAll };
};
