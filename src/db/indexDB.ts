import {
  openDB,
  deleteDB,
  DBSchema,
  IDBPDatabase,
  IDBPTransaction,
  StoreNames,
} from "idb";

import { DBAsset, DBTemplate } from "@/types/Repository";

const DB_NAME = "top8-db";
const DB_VERSION = 2;

interface StoreConfig {
  keyPath: string;
  indexes: readonly string[];
}

const STORE_CONFIGS = {
  assets: {
    keyPath: "id",
    indexes: ["date", "src"],
  },
  templates: {
    keyPath: "id",
    indexes: ["name"],
  },
} as const satisfies Record<string, StoreConfig>;

type StoreConfigMap = typeof STORE_CONFIGS;
type StoreName = keyof StoreConfigMap;

const EXPECTED_STORES = Object.keys(STORE_CONFIGS) as StoreName[];
interface Top8DB extends DBSchema {
  assets: {
    key: string;
    value: DBAsset;
    indexes: { date: Date; src: string };
  };
  templates: {
    key: string;
    value: DBTemplate;
    indexes: { name: string };
  };
}

type UpgradeTransaction = IDBPTransaction<
  Top8DB,
  StoreNames<Top8DB>[],
  "versionchange"
>;

function createStore(db: IDBPDatabase<Top8DB>, name: StoreName) {
  const config = STORE_CONFIGS[name];
  const store = db.createObjectStore(name, { keyPath: config.keyPath });

  for (const indexName of config.indexes) {
    (store as unknown as IDBObjectStore).createIndex(indexName, indexName);
  }
}

function validateStore(
  db: IDBPDatabase<Top8DB>,
  transaction: UpgradeTransaction,
  name: StoreName
) {
  const config = STORE_CONFIGS[name];

  if (!db.objectStoreNames.contains(name)) {
    createStore(db, name);
  } else {
    const store = transaction.objectStore(name) as unknown as IDBObjectStore;
    for (const indexName of config.indexes) {
      if (!store.indexNames.contains(indexName)) {
        store.createIndex(indexName, indexName);
      }
    }
  }
}

function createAllStores(db: IDBPDatabase<Top8DB>) {
  for (const name of EXPECTED_STORES) {
    createStore(db, name);
  }
}

function validateAllStores(
  db: IDBPDatabase<Top8DB>,
  transaction: UpgradeTransaction
) {
  for (const name of EXPECTED_STORES) {
    validateStore(db, transaction, name);
  }
}

function performUpgrade(
  db: IDBPDatabase<Top8DB>,
  oldVersion: number,
  transaction: UpgradeTransaction
) {
  console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);

  if (oldVersion === 0) {
    createAllStores(db);
    return;
  }

  validateAllStores(db, transaction);
}

function validateDatabase(db: IDBPDatabase<Top8DB>): boolean {
  for (const storeName of EXPECTED_STORES) {
    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`Missing object store: ${storeName}`);
      return false;
    }
  }
  return true;
}

async function deleteAndRecreateDatabase(): Promise<IDBPDatabase<Top8DB>> {
  console.warn("Database is corrupted. Deleting and recreating...");

  await deleteDB(DB_NAME, {
    blocked() {
      console.warn(
        "Database deletion blocked. Please close other tabs using this app."
      );
    },
  });

  return openDB<Top8DB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      createAllStores(db);
    },
  });
}

async function openDatabase(): Promise<IDBPDatabase<Top8DB>> {
  try {
    const db = await openDB<Top8DB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        performUpgrade(db, oldVersion, transaction);
      },
      blocked() {
        console.warn(
          "Database upgrade blocked. Please close other tabs using this app."
        );
      },
      blocking() {
        console.warn("This connection is blocking a database upgrade.");
      },
    });

    if (!validateDatabase(db)) {
      db.close();
      return deleteAndRecreateDatabase();
    }

    return db;
  } catch (error) {
    console.error("Failed to open database:", error);

    if (
      error instanceof Error &&
      (error.name === "NotFoundError" ||
        error.name === "InvalidStateError" ||
        error.name === "AbortError")
    ) {
      return deleteAndRecreateDatabase();
    }

    throw error;
  }
}

export const initDB = openDatabase();
