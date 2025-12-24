import { LayoutConfig } from "./top8/LayoutTypes";

export interface Store<T> {
  get(id: string): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  put(config: T): Promise<T>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export type DBConfig = {
  id: string;
  name: string;
  layout: LayoutConfig;
  selectedFont: string;
};

export type DBAsset = {
  id: string;
  fileName: string;
  data: Blob;
  date: Date;
};
