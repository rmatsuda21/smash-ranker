import {
  openDB,
  DBSchema,
  IDBPDatabase,
  IDBPTransaction,
  StoreNames,
} from "idb";

import { DBAsset, DBTemplate } from "@/types/Repository";

const DB_NAME = "top8-db";
const DB_VERSION = 2;

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

type Migration = (
  db: IDBPDatabase<Top8DB>,
  transaction: UpgradeTransaction
) => void;

const migrations: Record<number, Migration> = {
  1: (db) => {
    const assetsStore = db.createObjectStore("assets", {
      keyPath: "id",
    });
    assetsStore.createIndex("date", "date");
    assetsStore.createIndex("src", "src");

    db.createObjectStore("templates", {
      keyPath: "id",
    });
  },
  2: (_db, transaction) => {
    console.log("Migrating to version 2");
    const templatesStore = transaction.objectStore("templates");
    templatesStore.createIndex("name", "name");
  },
};

export const initDB = openDB<Top8DB>(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion, newVersion, transaction) {
    for (
      let version = oldVersion + 1;
      version <= (newVersion ?? DB_VERSION);
      version++
    ) {
      const migration = migrations[version];
      if (migration) {
        migration(db, transaction);
      } else {
        console.warn(`Missing migration for version ${version}`);
      }
    }
  },
});
