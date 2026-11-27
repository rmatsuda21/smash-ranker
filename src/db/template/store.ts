import { Store, DBTemplate } from "@/types/Repository";
import { getDb } from "../indexDB";

export class TemplateStore implements Store<DBTemplate> {
  async get(id: string) {
    const db = await getDb();
    return db.get("templates", id);
  }

  async getAll() {
    const db = await getDb();
    return db.getAll("templates");
  }

  async put(template: DBTemplate) {
    const db = await getDb();
    return new Promise<DBTemplate>((resolve, reject) => {
      db.put("templates", template)
        .then(() => resolve(template))
        .catch((error) => reject(error));
    });
  }

  async delete(id: string) {
    const db = await getDb();
    return db.delete("templates", id);
  }

  async clear() {
    const db = await getDb();
    return db.clear("templates");
  }
}
