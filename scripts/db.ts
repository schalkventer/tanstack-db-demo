import fs from "fs";
import { faker as f } from "@faker-js/faker";

import type {
  Member,
  Task,
  Category,
  Status,
  Team,
  Project,
} from "../src/types";

export type Tables = {
  members: Member[];
  tasks: Task[];
  categories: Category[];
  status: Status[];
  teams: Team[];
  projects: Project[];
};

const tables: Tables = {
  members: [],
  tasks: [],
  categories: [],
  status: [],
  teams: [],
  projects: [],
};

export const user: Member = {
  created: f.date.past().getTime(),
  id: f.string.uuid() as Member["id"],
  image: f.image.avatar(),
  name: "John Smith",
  email: "john@smith.com",
  updated: f.date.recent().getTime(),
};

tables.members.push(user);

new Array(f.number.int({ min: 70, max: 110 })).fill(0).forEach(() => {
  const member: Member = {
    id: f.string.uuid() as Member["id"],
    name: f.person.fullName(),
    image: f.image.avatar(),
    email: f.internet.email(),
    created: f.date.past().getTime(),
    updated: f.date.recent().getTime(),
  };

  tables.members.push(member);
});

new Array(f.number.int({ min: 4, max: 8 })).fill(0).forEach(() => {
  const innerMembers = f.helpers
    .arrayElements(tables.members, f.number.int({ min: 8, max: 30 }))
    .map((x) => x.id);

  const team: Team = {
    id: f.string.uuid() as Team["id"],
    owner: user.id,
    label: f.company.name(),
    members: innerMembers,
    created: f.date.past().getTime(),
    updated: f.date.recent().getTime(),
  };

  const categories = new Array(f.number.int({ min: 4, max: 11 }))
    .fill(0)
    .map(() => {
      const inner: Category = {
        id: f.string.uuid() as Category["id"],
        owner: user.id,
        label: f.commerce.department(),
        icon: f.internet.emoji(),
        team: team.id,
        created: f.date.past().getTime(),
        updated: f.date.recent().getTime(),
      };

      tables.categories.push(inner);
      return inner;
    });

  const status = new Array(f.number.int({ min: 4, max: 7 })).fill(0).map(() => {
    const inner: Status = {
      id: f.string.uuid() as Status["id"],
      owner: user.id,
      label: f.hacker.verb(),
      team: team.id,
      swatch: f.color.human(),
      created: f.date.past().getTime(),
      updated: f.date.recent().getTime(),
    };

    tables.status.push(inner);
    return inner;
  });

  new Array(f.number.int({ min: 8, max: 33 })).fill(0).map(() => {
    const inner: Project = {
      id: f.string.uuid() as Project["id"],
      owner: user.id,
      label: f.commerce.productName(),
      team: team.id,
      created: f.date.past().getTime(),
      updated: f.date.recent().getTime(),
    };

    tables.projects.push(inner);

    new Array(f.number.int({ min: 60, max: 380 })).fill(0).forEach(() => {
      const innerTask: Task = {
        id: f.string.uuid() as Task["id"],
        owner: user.id,
        label: f.hacker.phrase(),
        team: team.id,
        assigned: f.helpers.arrayElement(team.members),
        category: f.helpers.arrayElement(categories).id,
        status: f.helpers.arrayElement(status).id,
        project: inner.id,
        created: f.date.past().getTime(),
        updated: f.date.recent().getTime(),
      };

      tables.tasks.push(innerTask);
    });
  });

  tables.teams.push(team);
});

fs.writeFileSync("src/api/db.json", JSON.stringify(tables, null, 2));
