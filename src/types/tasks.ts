import { z } from "zod";

export const status = z.object({
  id: z.string().brand("STATUS_ID"),
  label: z.string(),
  swatch: z.string(),
  team: z.string().brand("TEAM_ID"),
  created: z.number(),
  updated: z.number(),
  owner: z.string().brand("MEMBER_ID").nullable(),
});

export const category = z.object({
  id: z.string().brand("CATEGORY_ID"),
  label: z.string(),
  icon: z.string(),
  team: z.string().brand("TEAM_ID"),
  created: z.number(),
  updated: z.number(),
  owner: z.string().brand("MEMBER_ID").nullable(),
});

export const project = z.object({
  id: z.string().brand("PROJECT_ID"),
  label: z.string(),
  team: z.string().brand("TEAM_ID"),
  created: z.number(),
  updated: z.number(),
  owner: z.string().brand("MEMBER_ID").nullable(),
});

export const task = z.object({
  id: z.string().brand("TASK_ID"),
  label: z.string(),
  status: z.string().brand("STATUS_ID"),
  team: z.string().brand("TEAM_ID"),
  category: z.string().brand("CATEGORY_ID"),
  assigned: z.string().brand("MEMBER_ID").nullable(),
  project: z.string().brand("PROJECT_ID"),
  created: z.number(),
  updated: z.number(),
  owner: z.string().brand("MEMBER_ID").nullable(),
});

export type Status = z.infer<typeof status>;
export type Category = z.infer<typeof category>;
export type Project = z.infer<typeof project>;
export type Task = z.infer<typeof task>;
