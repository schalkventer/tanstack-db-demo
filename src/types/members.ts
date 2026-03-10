import { z } from "zod";

export const member = z.object({
  id: z.string().brand("MEMBER_ID"),
  name: z.string(),
  image: z.string(),
  email: z.string(),
  created: z.number(),
  updated: z.number(),
});

export const role = z.object({
  id: z.enum(["owner", "viewer", "editor"]),
  label: z.string(),
});

export const team = z.object({
  id: z.string().brand("TEAM_ID"),
  label: z.string(),
  members: z.array(member.shape.id),
  created: z.number(),
  updated: z.number(),
  owner: z.string().brand("MEMBER_ID").nullable(),
});

export type Member = z.infer<typeof member>;
export type Role = z.infer<typeof role>;
export type Team = z.infer<typeof team>;
