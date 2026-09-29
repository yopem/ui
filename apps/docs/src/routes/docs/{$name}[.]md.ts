import { createFileRoute } from "@tanstack/react-router"

import { guidePages } from "@/catalog/docs-data"
import { getGuideSource } from "@/catalog/guide-sources"
import { createGuideText, markdownResponse } from "@/lib/plain-text"

export const Route = createFileRoute("/docs/{$name}.md")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const page = guidePages.find(
          (entry) => entry.url === `/docs/${params.name}`,
        )

        const source = page && getGuideSource(params.name)

        return source
          ? markdownResponse(
              createGuideText({ title: page.title, content: source }),
            )
          : markdownResponse("Page not found\n", 404)
      },
    },
  },
})
