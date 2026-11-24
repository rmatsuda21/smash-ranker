import { Design } from "./top8/Design";

export interface Store<T> {
  get(id: string): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  put(item: T): Promise<T>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export type DBTemplate = {
  id: string;
  name: string;
  design: Design;
  font: string;
  previewImage?: Blob;
};

export type DBAsset = {
  id: string;
  src: string;
  fileName: string;
  data: Blob;
  date: Date;
};

export type DBCustomFont = {
  id: string;
  fontFamily: string;
  fileName: string;
  data: Blob;
  date: Date;
};

// Templates saved by the first thumbnail editor. Nothing reads them any more;
// the store stays so existing data is left alone and a factory reset still
// clears it.
export type DBThumbnailTemplate = {
  id: string;
  name: string;
  design: unknown;
  font?: string;
  date: Date;
  previewImage?: Blob;
};

export type DBSocialTemplate = {
  id: string;
  name: string;
  body: string;
  createdAt: Date;
};
