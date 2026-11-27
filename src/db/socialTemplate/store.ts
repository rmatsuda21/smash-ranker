import { Store, DBSocialTemplate } from "@/types/Repository";
import { getDb } from "../indexDB";

export class SocialTemplateStore implements Store<DBSocialTemplate> {
  async get(id: string) {
    const db = await getDb();
    return db.get("socialTemplates", id);
  }

  async getAll() {
    const db = await getDb();
    return db.getAll("socialTemplates");
  }

  async put(template: DBSocialTemplate) {
    const db = await getDb();
    return new Promise<DBSocialTemplate>((resolve, reject) => {
      db.put("socialTemplates", template)
        .then(() => resolve(template))
        .catch((error) => reject(error));
    });
  }

  async delete(id: string) {
    const db = await getDb();
    return db.delete("socialTemplates", id);
  }

  async clear() {
    const db = await getDb();
    return db.clear("socialTemplates");
  }
}
