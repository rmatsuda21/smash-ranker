import { Store, DBConfig } from "@/types/Repository";
import { initDB } from "../indexDB";

export class ConfigStore implements Store<DBConfig> {
  async get(id: string) {
    const db = await initDB;
    return db.get("configs", id);
  }

  async getAll() {
    const db = await initDB;
    return db.getAll("configs");
  }

  async put(config: DBConfig) {
    const db = await initDB;
    return new Promise<DBConfig>((resolve, reject) => {
      db.put("configs", config)
        .then(() => resolve(config))
        .catch((error) => reject(error));
    });
  }

  async delete(id: string) {
    const db = await initDB;
    return db.delete("configs", id);
  }

  async clear() {
    const db = await initDB;
    return db.clear("configs");
  }
}
