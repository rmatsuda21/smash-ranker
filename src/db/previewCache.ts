import { deleteDB, openDB, type IDBPDatabase } from "idb";

const DB_NAME = "top8-preview-cache";
const DB_VERSION = 1;
const STORE_NAME = "previews";

// Opened on first use, not on import: `indexedDB.open` throws where storage
// is unavailable, and this module is imported by code that has to load
// regardless (the factory reset). A failed open is tried again next time.
let dbPromise: Promise<IDBPDatabase> | null = null;

const getDb = (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    const opening: Promise<IDBPDatabase> = (async () => {
      const forget = () => {
        if (dbPromise === opening) dbPromise = null;
      };
      const db: IDBPDatabase = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          db.createObjectStore(STORE_NAME);
        },
        // Another tab is deleting or upgrading the cache: let go, and open
        // again on the next read or write.
        blocking() {
          db.close();
          forget();
        },
        terminated: forget,
      });
      return db;
    })();
    dbPromise = opening;
    opening.catch(() => {
      if (dbPromise === opening) dbPromise = null;
    });
  }
  return dbPromise;
};

// A cache: a read that fails is a miss and a write that fails is skipped,
// so callers never have to handle storage being unavailable.
export const previewCache = {
  async get(templateId: string): Promise<Blob | undefined> {
    try {
      const db = await getDb();
      return await db.get(STORE_NAME, templateId);
    } catch {
      return undefined;
    }
  },

  async set(templateId: string, blob: Blob): Promise<void> {
    try {
      const db = await getDb();
      await db.put(STORE_NAME, blob, templateId);
    } catch {
      // The preview is rendered again next time.
    }
  },

  // A template that is gone needs no preview.
  async delete(templateId: string): Promise<void> {
    try {
      const db = await getDb();
      await db.delete(STORE_NAME, templateId);
    } catch {
      // Left behind; "Regenerate Thumbnails" clears the whole cache.
    }
  },

  async clear(): Promise<void> {
    const db = await getDb();
    await db.clear(STORE_NAME);
  },

  // For the factory reset: removes the cache's database, whether or not it
  // can still be opened.
  async destroy(): Promise<void> {
    const current = dbPromise;
    dbPromise = null;
    void current?.then(
      (db) => db.close(),
      () => {},
    );
    await deleteDB(DB_NAME);
  },
};
