import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/stylex/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/stylex/"!</div>
}
