import { Store, DBAsset } from "@/types/Repository";
import { getDb } from "../indexDB";

export class AssetStore implements Store<DBAsset> {
  async get(src: string) {
    const db = await getDb();
    return db.getFromIndex("assets", "src", src);
  }

  async getAll() {
    const db = await getDb();
    return db.getAllFromIndex("assets", "date");
  }

  async getBySrc(src: string) {
    const db = await getDb();
    return db.getFromIndex("assets", "src", src);
  }

  async put(asset: DBAsset) {
    const db = await getDb();
    return new Promise<DBAsset>((resolve, reject) => {
      db.put("assets", asset)
        .then(() => resolve(asset))
        .catch((error) => reject(error));
    });
  }

  async delete(id: string) {
    const db = await getDb();
    return db.delete("assets", id);
  }

  async clear() {
    const db = await getDb();
    return db.clear("assets");
  }
}
