import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "../api";
import { type Team } from "../types";
import { queryClient, queryKey, getTeams, stores } from "./data.helpers";
import { v4 as createId } from "uuid";
import { getDefaultStore } from "jotai";
import { atom } from "./data.session";

const createTeams = () => {
  let pushing: number = 0;
  const store = getDefaultStore();

  const collection = createCollection(
    queryCollectionOptions<Team, typeof getTeams>({
      getKey: (x) => x.id,
      queryKey,
      queryClient,
      queryFn: getTeams,
      syncMode: "eager",
      startSync: false,
      refetchInterval: () => (pushing > 0 ? false : 1000 * 60 * 5),

      onDelete: async ({ transaction }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          const { id } = x.original;
          await api.DELETE["api/teams/:id"](id);

          stores.teams.mutate((x) => {
            return x.filter((item) => item.id !== id);
          });
        });

        await Promise.all(promises);
        pushing -= 1;
      },

      onInsert: async ({ transaction, collection }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          const real = await api.POST["api/teams"]({
            label: x.changes.label!,
            members: x.changes.members!,
            owner: x.changes.owner!,
          });

          collection.utils.writeUpdate({
            id: real.id,
            created: real.created,
            updated: real.updated,
          });

          stores.teams.mutate((x) => {
            x.push(real);
          });
        });

        await Promise.all(promises);
        pushing -= 1;
      },

      onUpdate: async ({ transaction }) => {
        pushing += 1;

        const promises = transaction.mutations.map(async (x) => {
          const real = await api.PATCH["api/teams/:id"](x.original.id, {
            label: x.changes.label!,
            members: x.changes.members!,
          });

          collection.utils.writeUpdate({
            id: real.id,
            created: real.created,
            updated: real.updated,
          });

          stores.teams.mutate((x) => {
            const index = x.findIndex((item) => item.id === real.id);
            x[index] = real;
          });
        });

        await Promise.all(promises);
        pushing -= 1;
      },
    }),
  );

  if (collection.size === 0) {
    const local = stores.teams.get();
    collection.preload();

    local.forEach((item) => {
      collection.utils.writeInsert(item);
    });

    collection.startSyncImmediate();
  }

  return {
    collection,

    add: async (data: Pick<Team, "label" | "members">): Promise<void> => {
      const { label, members } = data;
      const temp = createId() as Team["id"];
      const owner = store.get(atom).member;

      if (!owner) {
        throw new Error("No active member found");
      }

      const result: Team = {
        label,
        created: Date.now(),
        id: temp,
        members: members,
        updated: Date.now(),
        owner,
      };

      const tx = collection.insert(result);
      await tx.isPersisted.promise;
    },

    remove: async (id: Team["id"]): Promise<void> => {
      const tx = collection.delete(id);
      await tx.isPersisted.promise;
    },

    update: async (
      id: Team["id"],
      changes: Partial<Pick<Team, "label">>,
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

export const teams = createTeams();
