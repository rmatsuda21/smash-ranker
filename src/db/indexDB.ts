import {
  openDB,
  DBSchema,
  IDBPDatabase,
  IDBPTransaction,
  StoreNames,
} from "idb";

import {
  DBAsset,
  DBCustomFont,
  DBSocialTemplate,
  DBTemplate,
  DBThumbnailTemplate,
} from "@/types/Repository";
import { logError, logWarning } from "@/utils/observability/log";

import { raiseDbNotice } from "./dbEvents";

const DB_NAME = "top8-db";
const DB_VERSION = 6;

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
  customFonts: {
    keyPath: "id",
    indexes: ["fontFamily", "date"],
  },
  thumbnailTemplates: {
    keyPath: "id",
    indexes: ["name", "date"],
  },
  thumbnailAssets: {
    keyPath: "id",
    indexes: ["date", "src"],
  },
  socialTemplates: {
    keyPath: "id",
    indexes: ["name", "createdAt"],
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
  customFonts: {
    key: string;
    value: DBCustomFont;
    indexes: { fontFamily: string; date: Date };
  };
  thumbnailTemplates: {
    key: string;
    value: DBThumbnailTemplate;
    indexes: { name: string; date: Date };
  };
  thumbnailAssets: {
    key: string;
    value: DBAsset;
    indexes: { date: Date; src: string };
  };
  socialTemplates: {
    key: string;
    value: DBSocialTemplate;
    indexes: { name: string; createdAt: Date };
  };
}

type UpgradeTransaction = IDBPTransaction<
  Top8DB,
  StoreNames<Top8DB>[],
  "versionchange"
>;

const createStore = (db: IDBPDatabase<Top8DB>, name: StoreName) => {
  const config = STORE_CONFIGS[name];
  const store = db.createObjectStore(name, { keyPath: config.keyPath });

  for (const indexName of config.indexes) {
    (store as unknown as IDBObjectStore).createIndex(indexName, indexName);
  }
};

const validateStore = (
  db: IDBPDatabase<Top8DB>,
  transaction: UpgradeTransaction,
  name: StoreName,
) => {
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
};

const createAllStores = (db: IDBPDatabase<Top8DB>) => {
  for (const name of EXPECTED_STORES) {
    createStore(db, name);
  }
};

const validateAllStores = (
  db: IDBPDatabase<Top8DB>,
  transaction: UpgradeTransaction,
) => {
  for (const name of EXPECTED_STORES) {
    validateStore(db, transaction, name);
  }
};

const performUpgrade = (
  db: IDBPDatabase<Top8DB>,
  oldVersion: number,
  transaction: UpgradeTransaction,
) => {
  if (oldVersion === 0) {
    createAllStores(db);
    return;
  }

  validateAllStores(db, transaction);
};

// Stores are only ever created in an upgrade, so one missing here means a
// store was added to STORE_CONFIGS without a new DB_VERSION. The database is
// kept as it is: the other stores work, and calls to the missing one fail
// until a version that adds it ships.
const reportMissingStores = (db: IDBPDatabase<Top8DB>) => {
  const missing = EXPECTED_STORES.filter(
    (name) => !db.objectStoreNames.contains(name),
  );
  if (missing.length === 0) return;
  logError(new Error(`Missing object stores: ${missing.join(", ")}`), {
    area: "indexdb-open",
    dbVersion: db.version,
  });
};

let connection: Promise<IDBPDatabase<Top8DB>> | null = null;
// A browser with storage turned off fails every open: report the first.
let openFailureReported = false;

// Drops a connection that has been closed, so the next call opens another.
const forget = (closed: IDBPDatabase<Top8DB>) => {
  const current = connection;
  if (!current) return;
  void current.then(
    (open) => {
      if (open === closed && connection === current) connection = null;
    },
    () => {},
  );
};

const openDatabase = async (): Promise<IDBPDatabase<Top8DB>> => {
  const db: IDBPDatabase<Top8DB> = await openDB<Top8DB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      performUpgrade(db, oldVersion, transaction);
    },
    blocked() {
      logWarning(
        "Database upgrade blocked. Please close other tabs using this app.",
        { area: "storage" },
      );
      raiseDbNotice("blocked");
    },
    blocking(_currentVersion, blockedVersion) {
      // Another tab is waiting on this connection. Let go, or it waits for
      // as long as this tab stays open.
      db.close();
      forget(db);

      // No version: the other tab is deleting the database (a reset), and
      // this tab opens a fresh one on its next read or write.
      if (blockedVersion === null) return;

      // A newer build upgraded it. This build cannot open that version, so
      // the tab works again only after a reload.
      logWarning("This connection is blocking a database upgrade.", {
        area: "storage",
      });
      raiseDbNotice("outdated");
    },
    terminated() {
      // The browser closed the connection itself (storage cleared, a
      // backgrounded tab on iOS). The next read or write opens another.
      logWarning("Database connection closed by the browser.", {
        area: "storage",
      });
      forget(db);
    },
  });

  reportMissingStores(db);
  return db;
};

// The database, opened on first use and again whenever the connection has
// been closed or an open has failed. Nothing here ever deletes it: a failed
// open can be passing (storage full, a connection the browser dropped), and
// what is stored is the user's templates, images and fonts. Only a factory
// reset erases it.
export const getDb = (): Promise<IDBPDatabase<Top8DB>> => {
  if (connection) return connection;

  const opening = openDatabase();
  connection = opening;
  opening.catch((error) => {
    if (connection === opening) connection = null;
    if (openFailureReported) return;
    openFailureReported = true;
    logError(error, { area: "indexdb-open" });
  });
  return opening;
};
