import { createFileRoute } from "@tanstack/react-router"

import { catalog } from "@/catalog/components"
import { createComponentIndexText, markdownResponse } from "@/lib/plain-text"

export const Route = createFileRoute("/components.md")({
  server: {
    handlers: {
      GET: () => markdownResponse(createComponentIndexText(catalog)),
    },
  },
})
