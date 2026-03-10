import { createFileRoute } from "@tanstack/react-router";
import { teams } from "../data";
import { useLiveQuery } from "@tanstack/react-db";
import { useIsFetching } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

const Teams = () => {
  const fetching = useIsFetching({ queryKey: ["sync"] });

  const { data } = useLiveQuery((q) => {
    return q.from({ x: teams.collection }).orderBy(({ x }) => x.label);
  });

  return (
    <>
      <h1>Select</h1>
      <div>{fetching ? "SYNCING..." : "IDLE"}</div>

      <ul>
        {data?.map((x) => {
          return (
            <li key={x.id}>
              <Link to="/$id" params={{ id: x.id }}>
                {x.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export const Route = createFileRoute("/")({
  component: Teams,
});
