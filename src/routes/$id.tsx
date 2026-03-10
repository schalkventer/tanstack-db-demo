import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { teams, tasks, members, status, projects } from "../data";
import { useLiveQuery, eq } from "@tanstack/react-db";
import { useIsFetching } from "@tanstack/react-query";

export const Route = createFileRoute("/$id")({
  component: Teams,
});

function Teams() {
  const { id } = Route.useParams();
  const [search, setSearch] = useState("");

  const fetching = useIsFetching({ queryKey: ["sync"] });

  const { data } = useLiveQuery((q) => {
    return q
      .from({ x: teams.collection })
      .where(({ x }) => eq(x.id, id))
      .findOne();
  });

  const { data: rows } = useLiveQuery(
    (q) => {
      return q
        .from({ x: tasks.collection })
        .where(({ x }) => eq(x.team, id))
        .fn.where(({ x }) =>
          search.trim() === ""
            ? true
            : x.label.toLowerCase().includes(search.toLowerCase()),
        )
        .join({ a: members.collection }, ({ x, a }) => eq(x.assigned, a.id))
        .join({ s: status.collection }, ({ x, s }) => eq(x.status, s.id))
        .join({ p: projects.collection }, ({ x, p }) => eq(x.project, p.id))

        .select(({ x, s, p, a }) => ({
          id: x.id,
          label: x.label ?? null,
          status: s?.label ?? null,
          swatch: s?.swatch ?? null,
          project: p?.label ?? null,
          assigned: a?.name ?? null,
        }))
        .offset(0)
        .limit(50)
        .orderBy(({ x }) => x.created);
    },
    [search],
  );

  return (
    <>
      <h1>{data?.label}</h1>
      <div>{fetching ? "SYNCING..." : "IDLE"}</div>

      <hr />

      <label>
        <span>Search</span>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <hr />

      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Status</th>
            <th>Project</th>
            <th>Assigned</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((x) => {
            return (
              <tr key={x.id}>
                <td style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.2)" }}>
                  {x.label}
                </td>

                <td
                  style={{
                    borderBottom: "1px solid rgba(0, 0, 0, 0.2)",
                    background: x.swatch ?? "inherit",
                  }}
                >
                  {x.status}
                </td>

                <td style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.2)" }}>
                  {x.project}
                </td>

                <td style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.2)" }}>
                  {x.assigned}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
