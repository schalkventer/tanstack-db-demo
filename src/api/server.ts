import db from "./db.json";
import { produce } from "immer";

import type { Member, Task, Category, Status, Team, Project } from "../types";

export type Tables = {
  members: Member[];
  tasks: Task[];
  categories: Category[];
  status: Status[];
  teams: Team[];
  projects: Project[];
};

let inner = {
  ...db,
} as Tables;

export const get = () => inner;

export const mutate = (fn: (draft: Tables) => void) => {
  inner = produce(inner, fn);
};
