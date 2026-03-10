import { api } from "../api";
import { parseLoadSubsetOptions } from "@tanstack/react-db";
import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";
import { CACHE } from "./data.cache";
import { createStore } from "idb-keyval";
import { type Team } from "../types";
import { clear, setMany } from "idb-keyval";

type SyncResponse = Awaited<ReturnType<(typeof api.GET)["api/sync/:team"]>>;

export const queryClient = new QueryClient();
export const queryKey = ["sync"] as const;

export const stores = {
  teams: createStore(`${CACHE}_TEAMS`, "data"),
  projects: createStore(`${CACHE}_PROJECTS`, "data"),
  categories: createStore(`${CACHE}_CATEGORIES`, "data"),
  status: createStore(`${CACHE}_STATUS`, "data"),
  tasks: createStore(`${CACHE}_TASKS`, "data"),
  members: createStore(`${CACHE}_MEMBERS`, "data"),
};

export const getTeams = async (): Promise<Team[]> => {
  const result = await api.GET["api/teams"]();
  await clear(stores.teams);

  await setMany(
    result.map((x) => [x.id, x]),
    stores.teams,
  );

  return result;
};

export const teamSync = async (
  context: QueryFunctionContext,
): Promise<SyncResponse> => {
  const { filters } = parseLoadSubsetOptions(context.meta?.loadSubsetOptions);

  const match = filters.find(
    (x) => x.field[0] === "team" && x.operator === "eq",
  );

  if (!match) {
    throw Error(
      "Query is only allowed to make use of only a single team subset",
    );
  }

  const result = await api.GET["api/sync/:team"](match.value);

  await setMany(
    result.members.map((x) => [x.id, x]),
    stores.members,
  );

  await setMany(
    result.categories.map((x) => [x.id, x]),
    stores.categories,
  );

  await setMany(
    result.status.map((x) => [x.id, x]),
    stores.status,
  );

  await setMany(
    result.tasks.map((x) => [x.id, x]),
    stores.tasks,
  );

  await setMany(
    result.projects.map((x) => [x.id, x]),
    stores.projects,
  );

  return result;
};
