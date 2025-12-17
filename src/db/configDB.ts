import { openDB, DBSchema } from "idb";

import { DBConfig } from "@/types/ConfigRepository";

const DB_NAME = "config-db";

interface ConfigDB extends DBSchema {
  configs: {
    key: string;
    value: DBConfig;
  };
}

export const configDbPromise = openDB<ConfigDB>(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore("configs", {
      keyPath: "id",
    });
  },
});
