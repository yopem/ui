import { createFileRoute } from "@tanstack/react-router"

import { editorParts } from "@/catalog/editor-parts"

export const Route = createFileRoute("/api/editor.json")({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          editorParts.map((part) => ({
            ...part,
            url: `/editor/${part.slug}`,
            markdown: `/editor/${part.slug}.md`,
            api: `/r/docs/${part.item}.json`,
          })),
          { headers: { "Cache-Control": "public, max-age=3600" } },
        ),
    },
  },
})
