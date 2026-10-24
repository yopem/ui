import { createFileRoute } from "@tanstack/react-router"

import { getEditorDocumentation } from "@/catalog/editor-documentation"
import { createComponentText, markdownResponse } from "@/lib/plain-text"

export const Route = createFileRoute("/editor/{$slug}.md")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const data = await getEditorDocumentation(params.slug)

        return data
          ? markdownResponse(createComponentText(data.title, data))
          : markdownResponse("Not found", 404)
      },
    },
  },
})
