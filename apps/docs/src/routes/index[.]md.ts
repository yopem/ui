import { createFileRoute } from "@tanstack/react-router"

import { guidePages } from "@/catalog/docs-data"
import { getGuideSource } from "@/catalog/guide-sources"
import { createGuideText, markdownResponse } from "@/lib/plain-text"

export const Route = createFileRoute("/index.md")({
  server: {
    handlers: {
      GET: () => {
        const page = guidePages.find((entry) => entry.url === "/")
        const source = getGuideSource("introduction")
        return page && source
          ? markdownResponse(
              createGuideText({ title: page.title, content: source }),
            )
          : markdownResponse("Page not found\n", 404)
      },
    },
  },
})
