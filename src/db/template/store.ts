import { Store, DBTemplate } from "@/types/Repository";
import { initDB } from "../indexDB";

export class TemplateStore implements Store<DBTemplate> {
  async get(id: string) {
    const db = await initDB;
    return db.get("templates", id);
  }

  async getAll() {
    const db = await initDB;
    return db.getAll("templates");
  }

  async put(template: DBTemplate) {
    const db = await initDB;
    return new Promise<DBTemplate>((resolve, reject) => {
      db.put("templates", template)
        .then(() => resolve(template))
        .catch((error) => reject(error));
    });
  }

  async delete(id: string) {
    const db = await initDB;
    return db.delete("templates", id);
  }

  async clear() {
    const db = await initDB;
    return db.clear("templates");
  }
}
