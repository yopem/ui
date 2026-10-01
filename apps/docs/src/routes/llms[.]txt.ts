import { createFileRoute } from "@tanstack/react-router"

import { catalog } from "@/catalog/components"
import { guidePages } from "@/catalog/docs-data"
import { createLlms, textResponse } from "@/lib/plain-text"
import { siteOrigin } from "@/lib/seo"

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () => textResponse(createLlms(siteOrigin, guidePages, catalog)),
    },
  },
})
