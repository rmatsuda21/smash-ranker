import { useState, useEffect } from "react";

import { DBConfig } from "@/types/Repository";
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
    const id = crypto.randomUUID();
    await configRepository.put({
      id,
      ...config,
    });
    await refresh();
    return id;
  };

  const deleteConfig = async (id: string) => {
    await configRepository.delete(id);
    await refresh();
  };

  const clearAll = async () => {
    await configRepository.clear();
    await refresh();
  };

  const getConfig = async (id: string) => {
    return await configRepository.get(id);
  };

  return { configs, loading, addConfig, deleteConfig, clearAll, getConfig };
};
