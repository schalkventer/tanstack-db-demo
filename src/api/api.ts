import { get, mutate } from "./server";
import { faker as f } from "@faker-js/faker";
import type { Member, Task, Category, Status, Team, Project } from "../types";

export type Tables = {
  members: Member[];
  tasks: Task[];
  categories: Category[];
  status: Status[];
  teams: Team[];
  projects: Project[];
};

const delay = () => new Promise((resolve) => setTimeout(resolve, 6000));

export const api = {
  GET: {
    "api/teams": async (): Promise<Team[]> => {
      await delay();
      const tables = get();
      return tables.teams;
    },

    "api/sync/:team": async (
      team: Team["id"],
    ): Promise<Omit<Tables, "teams">> => {
      await delay();
      const all = get();
      const match = all.teams.find((x) => x.id === team);

      return {
        categories: all.categories.filter((x) => x.team === team),
        projects: all.projects.filter((x) => x.team === team),
        status: all.status.filter((x) => x.team === team),
        tasks: all.tasks.filter((x) => x.team === team),

        members:
          match?.members.map((x) => all.members.find((m) => m.id === x)!) ?? [],
      };
    },
  },

  POST: {
    "api/auth": async (fields: { email: string; password: string }) => {
      const { password } = fields;
      await delay();

      if (password !== "password1") {
        return false;
      }

      return {
        user: get().members[0].id,
      };
    },

    "api/logout": async () => {
      await delay();
      return true;
    },

    "api/members": async (
      item: Omit<Member, "id" | "created" | "updated">,
    ): Promise<Member> => {
      await delay();

      const result: Member = {
        ...item,
        id: f.string.uuid() as Member["id"],
        created: Date.now(),
        updated: Date.now(),
      };

      mutate((x) => {
        x.members.push(result);
      });

      return result;
    },

    "api/tasks": async (
      item: Omit<Task, "id" | "created" | "updated">,
    ): Promise<Task> => {
      await delay();

      const result: Task = {
        ...item,
        id: f.string.uuid() as Task["id"],
        created: Date.now(),
        updated: Date.now(),
      };

      mutate((x) => {
        x.tasks.push(result);
      });

      return result;
    },

    "api/categories": async (
      item: Omit<Category, "id" | "created" | "updated">,
    ): Promise<Category> => {
      await delay();

      const result: Category = {
        ...item,
        id: f.string.uuid() as Category["id"],
        created: Date.now(),
        updated: Date.now(),
      };

      mutate((x) => {
        x.categories.push(result);
      });

      return result;
    },

    "api/status": async (
      item: Omit<Status, "id" | "created" | "updated">,
    ): Promise<Status> => {
      await delay();

      const result: Status = {
        ...item,
        id: f.string.uuid() as Status["id"],
        created: Date.now(),
        updated: Date.now(),
      };

      mutate((x) => {
        x.status.push(result);
      });

      return result;
    },

    "api/teams": async (
      item: Omit<Team, "id" | "created" | "updated">,
    ): Promise<Team> => {
      await delay();

      const result: Team = {
        ...item,
        id: f.string.uuid() as Team["id"],
        created: Date.now(),
        updated: Date.now(),
      };

      mutate((x) => {
        x.teams.push(result);
      });

      return result;
    },

    "api/projects": async (
      item: Omit<Project, "id" | "created" | "updated">,
    ): Promise<Project> => {
      await delay();

      const result: Project = {
        ...item,
        id: f.string.uuid() as Project["id"],
        created: Date.now(),
        updated: Date.now(),
      };

      mutate((x) => {
        x.projects.push(result);
      });

      return result;
    },
  },

  DELETE: {
    "api/members/:id": async (id: string) => {
      await delay();

      mutate((x) => {
        x.members = x.members.filter((item) => item.id !== id);
      });
    },

    "api/tasks/:id": async (id: string) => {
      await delay();

      mutate((x) => {
        x.tasks = x.tasks.filter((item) => item.id !== id);
      });
    },

    "api/categories/:id": async (id: string) => {
      await delay();

      mutate((x) => {
        x.categories = x.categories.filter((item) => item.id !== id);
      });
    },

    "api/status/:id": async (id: string) => {
      await delay();

      mutate((x) => {
        x.status = x.status.filter((item) => item.id !== id);
      });
    },

    "api/teams/:id": async (id: string) => {
      await delay();

      mutate((x) => {
        x.teams = x.teams.filter((item) => item.id !== id);
      });
    },

    "api/projects/:id": async (id: string) => {
      await delay();

      mutate((x) => {
        x.projects = x.projects.filter((item) => item.id !== id);
      });
    },
  },

  PATCH: {
    "api/members/:id": async (
      id: Member["id"],
      changes: Partial<Omit<Member, "id" | "created" | "updated">>,
    ): Promise<Member> => {
      await delay();
      const prev = get().members.find((x) => x.id === id);
      const next = { ...prev, ...changes, updated: Date.now() } as Member;

      mutate((x) => {
        x.members = x.members.map((x) => {
          if (x.id !== id) return x;
          return next;
        });
      });

      return next;
    },

    "api/tasks/:id": async (
      id: Task["id"],
      changes: Partial<Omit<Task, "id" | "created" | "updated">>,
    ): Promise<Task> => {
      await delay();
      const prev = get().tasks.find((x) => x.id === id);
      const next = { ...prev, ...changes, updated: Date.now() } as Task;

      mutate((x) => {
        x.tasks = x.tasks.map((x) => {
          if (x.id !== id) return x;
          return next;
        });
      });

      return next;
    },

    "api/categories/:id": async (
      id: Category["id"],
      changes: Partial<Omit<Category, "id" | "created" | "updated">>,
    ): Promise<Category> => {
      await delay();
      const prev = get().categories.find((x) => x.id === id);
      const next = { ...prev, ...changes, updated: Date.now() } as Category;

      mutate((x) => {
        x.categories = x.categories.map((x) => {
          if (x.id !== id) return x;
          return next;
        });
      });

      return next;
    },

    "api/status/:id": async (
      id: Status["id"],
      changes: Partial<Omit<Status, "id" | "created" | "updated">>,
    ): Promise<Status> => {
      await delay();
      const prev = get().status.find((x) => x.id === id);
      const next = { ...prev, ...changes, updated: Date.now() } as Status;

      mutate((x) => {
        x.status = x.status.map((x) => {
          if (x.id !== id) return x;
          return next;
        });
      });

      return next;
    },

    "api/teams/:id": async (
      id: Team["id"],
      changes: Partial<Omit<Team, "id" | "created" | "updated">>,
    ): Promise<Team> => {
      await delay();
      const prev = get().teams.find((x) => x.id === id);
      const next = { ...prev, ...changes, updated: Date.now() } as Team;

      mutate((x) => {
        x.teams = x.teams.map((x) => {
          if (x.id !== id) return x;
          return next;
        });
      });

      return next;
    },

    "api/projects/:id": async (
      id: Project["id"],
      changes: Partial<Omit<Project, "id" | "created" | "updated">>,
    ): Promise<Project> => {
      await delay();
      const prev = get().projects.find((x) => x.id === id);
      const next = { ...prev, ...changes, updated: Date.now() } as Project;

      mutate((x) => {
        x.projects = x.projects.map((x) => {
          if (x.id !== id) return x;
          return next;
        });
      });

      return next;
    },
  },
};
