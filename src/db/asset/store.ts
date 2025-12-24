import { Store, DBAsset } from "@/types/Repository";
import { initDB } from "../indexDB";

export class AssetStore implements Store<DBAsset> {
  async get(id: string) {
    const db = await initDB;
    return db.get("assets", id);
  }

  async getAll() {
    const db = await initDB;
    return db.getAllFromIndex("assets", "date");
  }

  async put(asset: DBAsset) {
    const db = await initDB;
    return new Promise<DBAsset>((resolve, reject) => {
      db.put("assets", asset)
        .then(() => resolve(asset))
        .catch((error) => reject(error));
    });
  }

  async delete(id: string) {
    const db = await initDB;
    return db.delete("assets", id);
  }

  async clear() {
    const db = await initDB;
    return db.clear("assets");
  }
}
