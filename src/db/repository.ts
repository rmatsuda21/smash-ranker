import type { IDBPDatabase } from "idb";

import {
  DBAsset,
  DBCustomFont,
  DBSocialTemplate,
  DBTemplate,
  Store,
} from "@/types/Repository";

import { getDb, type StoreName } from "./indexDB";

interface RepositoryOptions {
  // An index of the store to list its records by. Without one they come in
  // key order.
  orderBy?: string;
}

// The five operations every store has, over one object store. The schema's
// types tie a store's name to its record; `T` is given here, per store, and
// the database is used untyped inside.
const createRepository = <T extends { id: string }>(
  name: StoreName,
  { orderBy }: RepositoryOptions = {},
): Store<T> => {
  const open = async () => (await getDb()) as unknown as IDBPDatabase;

  return {
    async get(id) {
      return (await open()).get(name, id);
    },
    async getAll() {
      const db = await open();
      return orderBy ? db.getAllFromIndex(name, orderBy) : db.getAll(name);
    },
    async put(item) {
      await (await open()).put(name, item);
      return item;
    },
    async delete(id) {
      await (await open()).delete(name, id);
    },
    async clear() {
      await (await open()).clear(name);
    },
  };
};

export const templateRepository = createRepository<DBTemplate>("templates");
export const assetRepository = createRepository<DBAsset>("assets", {
  orderBy: "date",
});
export const customFontRepository = createRepository<DBCustomFont>(
  "customFonts",
  { orderBy: "date" },
);
export const socialTemplateRepository =
  createRepository<DBSocialTemplate>("socialTemplates");
