import { DBAsset, DBConfig, Store } from "@/types/Repository";
import { ConfigStore } from "@/db/config/store";
import { AssetStore } from "@/db/asset/store";

export const configRepository: Store<DBConfig> = new ConfigStore();
export const assetRepository: Store<DBAsset> = new AssetStore();
