import { Store, DBThumbnailTemplate } from "@/types/Repository";
import { getDb } from "../indexDB";

export class ThumbnailTemplateStore implements Store<DBThumbnailTemplate> {
  async get(id: string) {
    const db = await getDb();
    return db.get("thumbnailTemplates", id);
  }

  async getAll() {
    const db = await getDb();
    return db.getAll("thumbnailTemplates");
  }

  async put(template: DBThumbnailTemplate) {
    const db = await getDb();
    return new Promise<DBThumbnailTemplate>((resolve, reject) => {
      db.put("thumbnailTemplates", template)
        .then(() => resolve(template))
        .catch((error) => reject(error));
    });
  }

  async delete(id: string) {
    const db = await getDb();
    return db.delete("thumbnailTemplates", id);
  }

  async clear() {
    const db = await getDb();
    return db.clear("thumbnailTemplates");
  }
}
