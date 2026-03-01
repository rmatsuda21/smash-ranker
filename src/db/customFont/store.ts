import { Store, DBCustomFont } from "@/types/Repository";
import { initDB } from "../indexDB";

export class CustomFontStore implements Store<DBCustomFont> {
  async get(id: string) {
    const db = await initDB;
    return db.get("customFonts", id);
  }

  async getAll() {
    const db = await initDB;
    return db.getAllFromIndex("customFonts", "date");
  }

  async put(font: DBCustomFont) {
    const db = await initDB;
    await db.put("customFonts", font);
    return font;
  }

  async delete(id: string) {
    const db = await initDB;
    return db.delete("customFonts", id);
  }

  async clear() {
    const db = await initDB;
    return db.clear("customFonts");
  }
}
