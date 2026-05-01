import { Design } from "./top8/Design";
import { ThumbnailDesign } from "./thumbnail/ThumbnailDesign";

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

export type DBThumbnailTemplate = {
  id: string;
  name: string;
  design: ThumbnailDesign;
  font?: string;
  date: Date;
  previewImage?: Blob;
};
