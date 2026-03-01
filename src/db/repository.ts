import { DBAsset, DBCustomFont, DBTemplate, Store } from "@/types/Repository";
import { TemplateStore } from "@/db/template/store";
import { AssetStore } from "@/db/asset/store";
import { CustomFontStore } from "@/db/customFont/store";

export const templateRepository: Store<DBTemplate> = new TemplateStore();
export const assetRepository: Store<DBAsset> = new AssetStore();
export const customFontRepository: Store<DBCustomFont> = new CustomFontStore();
