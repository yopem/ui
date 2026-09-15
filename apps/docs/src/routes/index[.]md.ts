import { createFileRoute } from "@tanstack/react-router"

import { guidePages } from "@/catalog/docs-data"
import { createGuideText, markdownResponse } from "@/lib/plain-text"

export const Route = createFileRoute("/index.md")({
  server: {
    handlers: {
      GET: () => {
        const page = guidePages.find((entry) => entry.url === "/")
        return page
          ? markdownResponse(createGuideText(page))
          : markdownResponse("Page not found\n", 404)
      },
    },
  },
})
