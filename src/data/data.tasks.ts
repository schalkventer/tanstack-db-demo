import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "../api";
import { type Task } from "../types";
import { queryClient, queryKey, teamSync, stores } from "./data.helpers";
import { v4 as createId } from "uuid";
import { getDefaultStore } from "jotai";
import { del, set, values } from "idb-keyval";
import { atom } from "./data.session";

const createTasks = () => {
  const store = getDefaultStore();
  let pushing: number = 0;

  const collection = createCollection(
    queryCollectionOptions<Task, typeof teamSync>({
      getKey: (x) => x.id,
      queryKey,
      queryClient,
      queryFn: teamSync,
      startSync: false,
      select: (data): Task[] => data.tasks,
      refetchInterval: () => (pushing > 0 ? false : 1000 * 60 * 10),
      syncMode: "on-demand",

      onDelete: async ({ transaction }) => {
        pushing += 1;
        const promises = transaction.mutations.map(async (x) => {
          await api.DELETE["api/tasks/:id"](x.original.id);
          await del(x.original.id, stores.tasks);
        });

        await Promise.all(promises);

        pushing -= 1;
      },

      onInsert: async ({ transaction }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          const real = await api.POST["api/tasks"]({
            label: x.changes.label!,
            status: x.changes.status!,
            team: x.changes.team!,
            category: x.changes.category!,
            assigned: x.changes.assigned!,
            project: x.changes.project!,
            owner: x.changes.owner!,
          });

          collection.utils.writeUpdate({
            id: real.id,
            created: real.created,
            updated: real.updated,
          });

          await set(real.id, real, stores.tasks);
        });

        await Promise.all(promises);
        pushing -= 1;
      },

      onUpdate: async ({ transaction }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          const real = await api.PATCH["api/tasks/:id"](x.original.id, {
            label: x.changes.label!,
            status: x.changes.status!,
            team: x.changes.team!,
            category: x.changes.category!,
            assigned: x.changes.assigned!,
            project: x.changes.project!,
          });

          collection.utils.writeUpdate({
            id: real.id,
            created: real.created,
            updated: real.updated,
          });

          await set(x.original.id, real, stores.tasks);
        });

        await Promise.all(promises);
        pushing -= 1;
      },
    }),
  );

  if (collection.size === 0) {
    values(stores.tasks).then((x) => {
      collection.preload();

      x.forEach((item) => {
        collection.utils.writeInsert(item);
      });

      collection.startSyncImmediate();
    });
  }

  return {
    collection,
    add: (
      data: Pick<
        Task,
        "label" | "assigned" | "category" | "project" | "status"
      >,
    ): void => {
      const { label, assigned, category, project, status } = data;

      const owner = store.get(atom).member;
      const team = store.get(atom).team;

      if (!owner || !team) {
        throw new Error("No active member or team found");
      }

      const result: Task = {
        label,
        created: Date.now(),
        id: createId() as Task["id"],
        assigned,
        category,
        project,
        owner,
        status,
        team,
        updated: Date.now(),
      };

      collection.insert(result);
    },

    remove: (id: Task["id"]): void => {
      collection.delete(id);
    },

    update: (
      id: Task["id"],
      changes: Partial<
        Pick<Task, "label" | "status" | "category" | "assigned" | "project">
      >,
    ): void => {
      collection.update(id, (x) => {
        if (changes.label) {
          x.label = changes.label;
        }

        if (changes.status) {
          x.status = changes.status;
        }

        if (changes.category) {
          x.category = changes.category;
        }

        if (changes.assigned) {
          x.assigned = changes.assigned;
        }

        if (changes.project) {
          x.project = changes.project;
        }
      });
    },
  };
};

export const tasks = createTasks();
