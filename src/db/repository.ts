import { ConfigRepository } from "@/types/ConfigRepository";
import { IndexedDBConfigRepo } from "./IndexedDBConfigRepo";

export const configRepository: ConfigRepository = new IndexedDBConfigRepo();
