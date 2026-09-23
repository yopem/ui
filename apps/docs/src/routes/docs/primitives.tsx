import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/docs/primitives")({
  beforeLoad: () => {
    throw redirect({ to: "/docs/layout" })
  },
})
