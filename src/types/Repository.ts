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
};

export type DBAsset = {
  id: string;
  src: string;
  fileName: string;
  data: Blob;
  date: Date;
};
