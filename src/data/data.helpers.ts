import { api } from "../api";
import { parseLoadSubsetOptions } from "@tanstack/react-db";
import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";
import { CACHE } from "./data.cache";
import { createStore } from "idb-keyval";
import { type Team } from "../types";
import { produce } from "immer";
import { setMany } from "idb-keyval";

type SyncResponse = Awaited<ReturnType<(typeof api.GET)["api/sync/:team"]>>;

export const queryClient = new QueryClient();
export const queryKey = ["sync"] as const;

export const stores = {
  projects: createStore(`${CACHE}_PROJECTS`, "data"),
  categories: createStore(`${CACHE}_CATEGORIES`, "data"),
  status: createStore(`${CACHE}_STATUS`, "data"),
  tasks: createStore(`${CACHE}_TASKS`, "data"),
  members: createStore(`${CACHE}_MEMBERS`, "data"),

  teams: {
    get: (): Team[] => {
      const string = window.localStorage.getItem(`${CACHE}_TEAMS`);
      return string ? JSON.parse(string) : [];
    },
    set: (value: Team[]) => {
      window.localStorage.setItem(`${CACHE}_TEAMS`, JSON.stringify(value));
    },
    mutate: (fn: (draft: Team[]) => void) => {
      const current = stores.teams.get();
      const next = produce(current, fn);
      window.localStorage.setItem(`${CACHE}_TEAMS`, JSON.stringify(next));
    },
  },
};

export const getTeams = async (): Promise<Team[]> => {
  const result = await api.GET["api/teams"]();
  stores.teams.set(result);
  return result;
};

export const teamSync = async (
  context: QueryFunctionContext,
): Promise<SyncResponse> => {
  const { filters } = parseLoadSubsetOptions(context.meta?.loadSubsetOptions);

  const match = filters.find(
    (x) => x.field[0] === "team" && x.operator === "eq",
  );

  if (!match || !match.value) {
    throw Error(
      "Query is only allowed to make use of only a single team subset",
    );
  }

  const result = await api.GET["api/sync/:team"](match.value);

  console.log(result.members);

  setMany(
    result.members.map((x) => [x.id, x]),
    stores.members,
  );

  setMany(
    result.categories.map((x) => [x.id, x]),
    stores.categories,
  );

  setMany(
    result.status.map((x) => [x.id, x]),
    stores.status,
  );

  setMany(
    result.tasks.map((x) => [x.id, x]),
    stores.tasks,
  );

  setMany(
    result.projects.map((x) => [x.id, x]),
    stores.projects,
  );

  return result;
};
