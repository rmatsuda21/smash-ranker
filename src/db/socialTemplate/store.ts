import { Store, DBSocialTemplate } from "@/types/Repository";
import { initDB } from "../indexDB";

export class SocialTemplateStore implements Store<DBSocialTemplate> {
  async get(id: string) {
    const db = await initDB;
    return db.get("socialTemplates", id);
  }

  async getAll() {
    const db = await initDB;
    return db.getAll("socialTemplates");
  }

  async put(template: DBSocialTemplate) {
    const db = await initDB;
    return new Promise<DBSocialTemplate>((resolve, reject) => {
      db.put("socialTemplates", template)
        .then(() => resolve(template))
        .catch((error) => reject(error));
    });
  }

  async delete(id: string) {
    const db = await initDB;
    return db.delete("socialTemplates", id);
  }

  async clear() {
    const db = await initDB;
    return db.clear("socialTemplates");
  }
}
