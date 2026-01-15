import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$projectName/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectName } = Route.useParams();

  return (
    <div className="bold">
      <a href={`/${projectName}/test`}>${projectName}/test</a>
    </div>
  );
}
