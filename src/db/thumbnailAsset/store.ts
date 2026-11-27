import { Store, DBAsset } from "@/types/Repository";
import { getDb } from "../indexDB";

export class ThumbnailAssetStore implements Store<DBAsset> {
  async get(src: string) {
    const db = await getDb();
    return db.getFromIndex("thumbnailAssets", "src", src);
  }

  async getAll() {
    const db = await getDb();
    return db.getAllFromIndex("thumbnailAssets", "date");
  }

  async getBySrc(src: string) {
    const db = await getDb();
    return db.getFromIndex("thumbnailAssets", "src", src);
  }

  async put(asset: DBAsset) {
    const db = await getDb();
    return new Promise<DBAsset>((resolve, reject) => {
      db.put("thumbnailAssets", asset)
        .then(() => resolve(asset))
        .catch((error) => reject(error));
    });
  }

  async delete(id: string) {
    const db = await getDb();
    return db.delete("thumbnailAssets", id);
  }

  async clear() {
    const db = await getDb();
    return db.clear("thumbnailAssets");
  }
}
