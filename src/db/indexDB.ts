import { DBAsset, DBConfig } from "@/types/Repository";
import { openDB, DBSchema } from "idb";

const DB_NAME = "top8-db";

interface Top8DB extends DBSchema {
  assets: {
    key: string;
    value: DBAsset;
    indexes: { date: Date };
  };
  configs: {
    key: string;
    value: DBConfig;
  };
}

export const initDB = openDB<Top8DB>(DB_NAME, 1, {
  upgrade(db) {
    const assetsStore = db.createObjectStore("assets", {
      keyPath: "id",
    });
    assetsStore.createIndex("date", "date");

    db.createObjectStore("configs", {
      keyPath: "id",
    });
  },
});
