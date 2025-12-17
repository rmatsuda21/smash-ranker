import { LayoutConfig } from "./top8/LayoutTypes";

export interface ConfigRepository {
  get(id: string): Promise<DBConfig | undefined>;
  getAll(): Promise<DBConfig[]>;
  put(config: DBConfig): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export type DBConfig = {
  id: string;
  name: string;
  layout: LayoutConfig;
  selectedFont: string;
};
