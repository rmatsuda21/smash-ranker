import { DBAsset, DBTemplate, Store } from "@/types/Repository";
import { TemplateStore } from "@/db/template/store";
import { AssetStore } from "@/db/asset/store";

export const templateRepository: Store<DBTemplate> = new TemplateStore();
export const assetRepository: Store<DBAsset> = new AssetStore();
