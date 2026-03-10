import { createFileRoute } from "@tanstack/react-router";
import { teams, projects } from "../data";
import { useLiveQuery, eq } from "@tanstack/react-db";
import { useIsFetching } from "@tanstack/react-query";

export const Route = createFileRoute("/$id")({
  component: Teams,
});

function Teams() {
  const { id } = Route.useParams();

  const fetching = useIsFetching({ queryKey: ["sync"] });

  const { data } = useLiveQuery((q) => {
    return q
      .from({ x: teams.collection })
      .where(({ x }) => eq(x.id, id))
      .findOne();
  });

  const { data: all } = useLiveQuery((q) => {
    return q.from({ p: projects.collection }).where(({ p }) => eq(p.team, id));
  });

  console.log(all);

  return (
    <>
      <h1>{data?.label}</h1>
      <div>{fetching ? "SYNCING..." : "IDLE"}</div>
      <pre>
        <code>{JSON.stringify(all, null, 2)}</code>
      </pre>
    </>
  );
}
