import { useState, useEffect, useCallback } from "react";

import { DBAsset, Store } from "@/types/Repository";
import { assetRepository } from "@/db/repository";

const BASE_URL = "/idb-images/";

export const useAssetDB = (repository: Store<DBAsset> = assetRepository) => {
  const [assets, setAssets] = useState<DBAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setAssets(await repository.getAll());
  }, [repository]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const uploadAsset = async (asset: Omit<DBAsset, "id" | "src">) => {
    const id = crypto.randomUUID();
    const src = `${BASE_URL}${id}`;
    await repository.put({ id, src, ...asset });
    await refresh();
    return src;
  };

  const deleteAsset = async (id: string) => {
    await repository.delete(id);
    await refresh();
  };

  const clearAll = async () => {
    await repository.clear();
    await refresh();
  };

  const getAsset = async (id: string) => {
    return await repository.get(id);
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
