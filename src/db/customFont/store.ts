import { Store, DBCustomFont } from "@/types/Repository";
import { getDb } from "../indexDB";

export class CustomFontStore implements Store<DBCustomFont> {
  async get(id: string) {
    const db = await getDb();
    return db.get("customFonts", id);
  }

  async getAll() {
    const db = await getDb();
    return db.getAllFromIndex("customFonts", "date");
  }

  async put(font: DBCustomFont) {
    const db = await getDb();
    await db.put("customFonts", font);
    return font;
  }

  async delete(id: string) {
    const db = await getDb();
    return db.delete("customFonts", id);
  }

  async clear() {
    const db = await getDb();
    return db.clear("customFonts");
  }
}
