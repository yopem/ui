import { createFileRoute } from "@tanstack/react-router"

import { guidePages } from "@/catalog/docs-data"
import { createGuideText, markdownResponse } from "@/lib/plain-text"

export const Route = createFileRoute("/docs/{$name}.md")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const page = guidePages.find(
          (entry) => entry.url === `/docs/${params.name}`,
        )
        return page
          ? markdownResponse(createGuideText(page))
          : markdownResponse("Page not found\n", 404)
      },
    },
  },
})
