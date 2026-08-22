import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tailwind/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/tailwind/"!</div>;
}
