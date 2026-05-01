import { Store, DBThumbnailTemplate } from "@/types/Repository";
import { initDB } from "../indexDB";

export class ThumbnailTemplateStore implements Store<DBThumbnailTemplate> {
  async get(id: string) {
    const db = await initDB;
    return db.get("thumbnailTemplates", id);
  }

  async getAll() {
    const db = await initDB;
    return db.getAll("thumbnailTemplates");
  }

  async put(template: DBThumbnailTemplate) {
    const db = await initDB;
    return new Promise<DBThumbnailTemplate>((resolve, reject) => {
      db.put("thumbnailTemplates", template)
        .then(() => resolve(template))
        .catch((error) => reject(error));
    });
  }

  async delete(id: string) {
    const db = await initDB;
    return db.delete("thumbnailTemplates", id);
  }

  async clear() {
    const db = await initDB;
    return db.clear("thumbnailTemplates");
  }
}
