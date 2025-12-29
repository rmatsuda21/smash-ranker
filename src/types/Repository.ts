import { Design } from "./top8/Design";

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
  layout: Design;
  selectedFont: string;
};

export type DBAsset = {
  id: string;
  src: string;
  fileName: string;
  data: Blob;
  date: Date;
};
