import { useState, useEffect } from "react";

import { DBAsset } from "@/types/Repository";
import { assetRepository } from "@/db/repository";

export const useAssetDB = () => {
  const [assets, setAssets] = useState<DBAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setAssets(await assetRepository.getAll());
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const uploadAsset = async (asset: Omit<DBAsset, "id">) => {
    const id = crypto.randomUUID();
    await assetRepository.put({
      id,
      ...asset,
    });
    await refresh();
    return id;
  };

  const deleteAsset = async (id: string) => {
    await assetRepository.delete(id);
    await refresh();
  };

  const clearAll = async () => {
    await assetRepository.clear();
    await refresh();
  };

  const getAsset = async (id: string) => {
    return await assetRepository.get(id);
  };

  return {
    assets,
    loading,
    uploadAsset,
    deleteAsset,
    clearAll,
    getAsset,
    refresh,
  };
};
