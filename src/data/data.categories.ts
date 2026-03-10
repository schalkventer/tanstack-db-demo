import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "../api";
import { getDefaultStore } from "jotai";
import { type Category } from "../types";
import { queryClient, queryKey, teamSync, stores } from "./data.helpers";
import { v4 as createId } from "uuid";
import { set, del, values } from "idb-keyval";
import { atom } from "./data.session";

const createCategories = () => {
  const store = getDefaultStore();
  let pushing: number = 0;

  const collection = createCollection(
    queryCollectionOptions<Category, typeof teamSync>({
      getKey: (x) => x.id,
      queryKey,
      queryClient,
      queryFn: teamSync,
      startSync: false,
      select: (data): Category[] => data.categories,
      refetchInterval: () => (pushing > 0 ? false : 1000 * 60 * 10),
      syncMode: "on-demand",

      onDelete: async ({ transaction }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          await api.DELETE["api/categories/:id"](x.original.id);
          await del(x.original.id, stores.categories);
        });

        await Promise.all(promises);
        pushing -= 1;
      },

      onInsert: async ({ transaction, collection }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          const real = await api.POST["api/categories"]({
            label: x.changes.label!,
            icon: x.changes.icon!,
            team: x.changes.team!,
            owner: x.changes.owner!,
          });

          collection.utils.writeUpdate({
            id: real.id,
            created: real.created,
            updated: real.updated,
          });

          await set(real.id, real, stores.categories);
        });

        await Promise.all(promises);
        pushing -= 1;
      },

      onUpdate: async ({ transaction, collection }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          const real = await api.PATCH["api/categories/:id"](x.original.id, {
            label: x.changes.label!,
            icon: x.changes.icon!,
          });

          collection.utils.writeUpdate({
            id: real.id,
            created: real.created,
            updated: real.updated,
          });

          await set(x.original.id, real, stores.categories);
        });

        await Promise.all(promises);
        pushing -= 1;
      },
    }),
  );

  if (collection.size === 0) {
    values(stores.members).then((x) => {
      collection.preload();

      x.forEach((item) => {
        collection.utils.writeInsert(item);
      });

      collection.startSyncImmediate();
    });
  }

  return {
    collection,

    add: async (data: Pick<Category, "label" | "icon">): Promise<void> => {
      const { label, icon } = data;
      const temp = createId() as Category["id"];

      const owner = store.get(atom).member;
      const team = store.get(atom).team;

      if (!owner || !team) {
        throw new Error("No active member or team found");
      }

      const result: Category = {
        label,
        icon,
        team,
        owner,
        created: Date.now(),
        id: temp,
        updated: Date.now(),
      };

      const tx = collection.insert(result);
      await tx.isPersisted.promise;
    },

    remove: async (id: Category["id"]): Promise<void> => {
      const tx = collection.delete(id);
      await tx.isPersisted.promise;
    },

    update: async (
      id: Category["id"],
      changes: Partial<Pick<Category, "label" | "icon">>,
    ): Promise<void> => {
      const tx = collection.update(id, (x) => {
        if (changes.label) {
          x.label = changes.label;
        }

        if (changes.icon) {
          x.icon = changes.icon;
        }
      });

      await tx.isPersisted.promise;
    },
  };
};

export const categories = createCategories();
