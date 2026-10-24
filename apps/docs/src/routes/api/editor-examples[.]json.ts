import { createFileRoute } from "@tanstack/react-router"

import { getCoreEditorExamples } from "@/catalog/editor-examples-core"

export const Route = createFileRoute("/api/editor-examples.json")({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          { examples: getCoreEditorExamples() },
          { headers: { "Cache-Control": "public, max-age=3600" } },
        ),
    },
  },
})
