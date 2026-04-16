import { openDB } from "idb";

const DB_NAME = "top8-preview-cache";
const DB_VERSION = 1;
const STORE_NAME = "previews";

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME);
  },
});

export const previewCache = {
  async get(templateId: string): Promise<Blob | undefined> {
    const db = await dbPromise;
    return db.get(STORE_NAME, templateId);
  },

  async set(templateId: string, blob: Blob): Promise<void> {
    const db = await dbPromise;
    await db.put(STORE_NAME, blob, templateId);
  },

  async clear(): Promise<void> {
    const db = await dbPromise;
    await db.clear(STORE_NAME);
  },
};
