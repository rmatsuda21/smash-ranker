import {
  DBAsset,
  DBCustomFont,
  DBSocialTemplate,
  DBTemplate,
  DBThumbnailTemplate,
  Store,
} from "@/types/Repository";
import { TemplateStore } from "@/db/template/store";
import { AssetStore } from "@/db/asset/store";
import { CustomFontStore } from "@/db/customFont/store";
import { ThumbnailTemplateStore } from "@/db/thumbnailTemplate/store";
import { ThumbnailAssetStore } from "@/db/thumbnailAsset/store";
import { SocialTemplateStore } from "@/db/socialTemplate/store";

export const templateRepository: Store<DBTemplate> = new TemplateStore();
export const assetRepository: Store<DBAsset> = new AssetStore();
export const customFontRepository: Store<DBCustomFont> = new CustomFontStore();
export const thumbnailTemplateRepository: Store<DBThumbnailTemplate> =
  new ThumbnailTemplateStore();
export const thumbnailAssetRepository: Store<DBAsset> =
  new ThumbnailAssetStore();
export const socialTemplateRepository: Store<DBSocialTemplate> =
  new SocialTemplateStore();
