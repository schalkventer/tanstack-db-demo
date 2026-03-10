import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "../api";
import { type Project } from "../types";
import { getDefaultStore } from "jotai";
import { queryClient, queryKey, teamSync, stores } from "./data.helpers";
import { v4 as createId } from "uuid";
import { set, del, values } from "idb-keyval";
import { atom } from "./data.session";

const createProjects = () => {
  const store = getDefaultStore();
  let pushing: number = 0;

  const collection = createCollection(
    queryCollectionOptions<Project, typeof teamSync>({
      getKey: (x) => x.id,
      queryKey,
      queryClient,
      startSync: false,
      queryFn: teamSync,
      select: (data): Project[] => data.projects,
      refetchInterval: () => (pushing > 0 ? false : 1000 * 60 * 10),
      syncMode: "on-demand",

      onDelete: async ({ transaction }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          await api.DELETE["api/projects/:id"](x.original.id);
          await del(x.original.id, stores.projects);
        });

        await Promise.all(promises);
        pushing -= 1;
      },

      onInsert: async ({ transaction, collection }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          const real = await api.POST["api/projects"]({
            label: x.changes.label!,
            team: x.changes.team!,
            owner: x.changes.owner!,
          });

          collection.utils.writeUpdate({
            id: real.id,
            created: real.created,
            updated: real.updated,
          });

          await set(real.id, real, stores.projects);
        });

        await Promise.all(promises);
        pushing -= 1;
      },

      onUpdate: async ({ transaction, collection }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          const real = await api.PATCH["api/projects/:id"](x.original.id, {
            label: x.changes.label!,
          });

          collection.utils.writeUpdate({
            id: real.id,
            created: real.created,
            updated: real.updated,
          });

          await set(x.original.id, real, stores.projects);
        });

        await Promise.all(promises);
        pushing -= 1;
      },
    }),
  );

  if (collection.size === 0) {
    values(stores.projects).then((x) => {
      collection.preload();

      x.forEach((item) => {
        console.log(item);
        collection.utils.writeInsert(item);
      });

      collection.startSyncImmediate();
    });
  }

  return {
    collection,

    add: async (data: Pick<Project, "label">): Promise<void> => {
      const { label } = data;
      const temp = createId() as Project["id"];

      const owner = store.get(atom).member;
      const team = store.get(atom).team;

      if (!owner || !team) {
        throw new Error("No active member or team found");
      }

      const result: Project = {
        label,
        team,
        owner,
        created: Date.now(),
        id: temp,
        updated: Date.now(),
      };

      const tx = collection.insert(result);
      await tx.isPersisted.promise;
    },

    remove: async (id: Project["id"]): Promise<void> => {
      const tx = collection.delete(id);
      await tx.isPersisted.promise;
    },

    update: async (
      id: Project["id"],
      changes: Partial<Pick<Project, "label">>,
    ): Promise<void> => {
      const tx = collection.update(id, (x) => {
        if (changes.label) {
          x.label = changes.label;
        }
      });

      await tx.isPersisted.promise;
    },
  };
};

export const projects = createProjects();
