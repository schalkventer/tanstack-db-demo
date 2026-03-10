import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "../api";
import { type Member } from "../types";
import { queryClient, queryKey, teamSync, stores } from "./data.helpers";
import { v4 as createId } from "uuid";
import { del, set, values } from "idb-keyval";

const createMembers = () => {
  let pushing: number = 0;

  const collection = createCollection(
    queryCollectionOptions<Member, typeof teamSync>({
      getKey: (x) => x.id,
      queryKey,
      queryClient,
      queryFn: teamSync,
      startSync: false,
      select: (data): Member[] => data.members,
      refetchInterval: () => (pushing > 0 ? false : 1000 * 60 * 10),
      syncMode: "on-demand",

      onDelete: async ({ transaction }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          await api.DELETE["api/members/:id"](x.original.id);
          await del(x.original.id, stores.members);
        });

        await Promise.all(promises);
        pushing -= 1;
      },

      onInsert: async ({ transaction, collection }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          const real = await api.POST["api/members"]({
            email: x.changes.email!,
            name: x.changes.name!,
            image: x.changes.image!,
          });

          collection.utils.writeUpdate({
            id: real.id,
            created: real.created,
            updated: real.updated,
          });

          await set(real.id, real, stores.members);
        });

        await Promise.all(promises);
        pushing -= 1;
      },

      onUpdate: async ({ transaction, collection }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          const real = await api.PATCH["api/members/:id"](x.original.id, {
            email: x.changes.email!,
            name: x.changes.name!,
            image: x.changes.image!,
          });

          collection.utils.writeUpdate({
            id: real.id,
            created: real.created,
            updated: real.updated,
          });

          await set(x.original.id, real, stores.members);
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

    add: async (data: Pick<Member, "email" | "name" | "image">) => {
      const { email, name, image } = data;

      const result: Member = {
        email,
        name,
        image,
        created: Date.now(),
        id: createId() as Member["id"],
        updated: Date.now(),
      };

      const tx = collection.insert(result);
      await tx.isPersisted.promise;
    },

    remove: async (id: Member["id"]): Promise<void> => {
      const tx = collection.delete(id);
      await tx.isPersisted.promise;
    },

    update: async (
      id: Member["id"],
      changes: Partial<Pick<Member, "email" | "name" | "image">>,
    ): Promise<void> => {
      const tx = collection.update(id, (x) => {
        if (changes.email) {
          x.email = changes.email;
        }

        if (changes.name) {
          x.name = changes.name;
        }

        if (changes.image) {
          x.image = changes.image;
        }
      });

      await tx.isPersisted.promise;
    },
  };
};

export const members = createMembers();
