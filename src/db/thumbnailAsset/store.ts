import { Store, DBAsset } from "@/types/Repository";
import { initDB } from "../indexDB";

export class ThumbnailAssetStore implements Store<DBAsset> {
  async get(src: string) {
    const db = await initDB;
    return db.getFromIndex("thumbnailAssets", "src", src);
  }

  async getAll() {
    const db = await initDB;
    return db.getAllFromIndex("thumbnailAssets", "date");
  }

  async getBySrc(src: string) {
    const db = await initDB;
    return db.getFromIndex("thumbnailAssets", "src", src);
  }

  async put(asset: DBAsset) {
    const db = await initDB;
    return new Promise<DBAsset>((resolve, reject) => {
      db.put("thumbnailAssets", asset)
        .then(() => resolve(asset))
        .catch((error) => reject(error));
    });
  }

  async delete(id: string) {
    const db = await initDB;
    return db.delete("thumbnailAssets", id);
  }

  async clear() {
    const db = await initDB;
    return db.clear("thumbnailAssets");
  }
}
