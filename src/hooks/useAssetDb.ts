import { useState, useEffect } from "react";

import { DBAsset } from "@/types/Repository";
import { assetRepository } from "@/db/repository";

const BASE_URL = "/idb-images/";

export const useAssetDB = () => {
  const [assets, setAssets] = useState<DBAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setAssets(await assetRepository.getAll());
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const uploadAsset = async (asset: Omit<DBAsset, "id" | "src">) => {
    const id = crypto.randomUUID();
    const src = `${BASE_URL}${id}`;
    await assetRepository.put({ id, src, ...asset });
    await refresh();
    return src;
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
