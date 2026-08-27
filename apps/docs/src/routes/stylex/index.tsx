import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/stylex/")({
  beforeLoad: () => {
    throw redirect({ to: "/components" })
  },
})
