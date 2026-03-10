import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "../api";
import { getDefaultStore } from "jotai";
import { type Status } from "../types";
import { queryClient, queryKey, teamSync, stores } from "./data.helpers";
import { v4 as createId } from "uuid";
import { set, del, values } from "idb-keyval";
import { atom } from "./data.session";

const createStatus = () => {
  const store = getDefaultStore();
  let pushing: number = 0;

  const collection = createCollection(
    queryCollectionOptions<Status, typeof teamSync>({
      getKey: (x) => x.id,
      queryKey,
      queryClient,
      queryFn: teamSync,
      startSync: false,
      refetchInterval: () => (pushing > 0 ? false : 1000 * 60 * 10),
      select: (data): Status[] => data.status,
      syncMode: "on-demand",

      onDelete: async ({ transaction }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          await api.DELETE["api/status/:id"](x.original.id);
          await del(x.original.id, stores.status);
        });

        await Promise.all(promises);
        pushing -= 1;
      },

      onInsert: async ({ transaction, collection }) => {
        pushing += 1;
        const promises = transaction.mutations.map(async (x) => {
          const real = await api.POST["api/status"]({
            label: x.changes.label!,
            swatch: x.changes.swatch!,
            team: x.changes.team!,
            owner: x.changes.owner!,
          });

          collection.utils.writeUpdate({
            id: real.id,
            created: real.created,
            updated: real.updated,
          });

          await set(real.id, real, stores.status);
        });

        await Promise.all(promises);
        pushing -= 1;
      },

      onUpdate: async ({ transaction, collection }) => {
        pushing += 1;
        const promises = transaction.mutations.map(async (x) => {
          const real = await api.PATCH["api/status/:id"](x.original.id, {
            label: x.changes.label!,
            swatch: x.changes.swatch!,
          });

          collection.utils.writeUpdate({
            id: real.id,
            created: real.created,
            updated: real.updated,
          });

          await set(x.original.id, real, stores.status);
        });

        await Promise.all(promises);
        pushing -= 1;
      },
    }),
  );

  if (collection.size === 0) {
    values(stores.status).then((x) => {
      collection.preload();

      x.forEach((item) => {
        collection.utils.writeInsert(item);
      });

      collection.startSyncImmediate();
    });
  }

  return {
    collection,

    add: async (data: Pick<Status, "label" | "swatch">): Promise<void> => {
      const { label, swatch } = data;
      const temp = createId() as Status["id"];

      const owner = store.get(atom).member;
      const team = store.get(atom).team;

      if (!owner || !team) {
        throw new Error("No active member or team found");
      }

      const result: Status = {
        label,
        swatch,
        team,
        owner,
        created: Date.now(),
        id: temp,
        updated: Date.now(),
      };

      const tx = collection.insert(result);
      await tx.isPersisted.promise;
    },

    remove: async (id: Status["id"]): Promise<void> => {
      const tx = collection.delete(id);
      await tx.isPersisted.promise;
    },

    update: async (
      id: Status["id"],
      changes: Partial<Pick<Status, "label" | "swatch">>,
    ): Promise<void> => {
      const tx = collection.update(id, (x) => {
        if (changes.label) {
          x.label = changes.label;
        }

        if (changes.swatch) {
          x.swatch = changes.swatch;
        }
      });

      await tx.isPersisted.promise;
    },
  };
};

export const status = createStatus();
