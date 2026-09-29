import { createFileRoute } from "@tanstack/react-router"

import { getCatalogItem } from "@/catalog/components"
import { getDocumentation } from "@/catalog/docs.functions"
import { createComponentText, markdownResponse } from "@/lib/plain-text"

export const Route = createFileRoute("/components/{$name}.md")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const item = getCatalogItem(params.name)

        if (!item) return markdownResponse("Page not found\n", 404)
        const data = await getDocumentation({ data: params.name })

        return markdownResponse(createComponentText(item.title, data))
      },
    },
  },
})
