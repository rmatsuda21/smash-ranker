import { ConfigRepository, DBConfig } from "@/types/ConfigRepository";
import { configDbPromise } from "./configDB";

export class IndexedDBConfigRepo implements ConfigRepository {
  async get(id: string): Promise<DBConfig | undefined> {
    const db = await configDbPromise;
    return db.get("configs", id);
  }

  async getAll(): Promise<DBConfig[]> {
    const db = await configDbPromise;
    return db.getAll("configs");
  }

  async put(config: DBConfig): Promise<void> {
    const db = await configDbPromise;
    return new Promise((resolve, reject) => {
      db.put("configs", config)
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  async delete(id: string): Promise<void> {
    const db = await configDbPromise;
    return db.delete("configs", id);
  }

  async clear(): Promise<void> {
    const db = await configDbPromise;
    return db.clear("configs");
  }
}
