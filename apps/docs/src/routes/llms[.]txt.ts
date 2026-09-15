import { createFileRoute } from "@tanstack/react-router"

import { catalog } from "@/catalog/components"
import { guidePages } from "@/catalog/docs-data"
import { createLlms, textResponse } from "@/lib/plain-text"

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: ({ request }) =>
        textResponse(
          createLlms(new URL(request.url).origin, guidePages, catalog),
        ),
    },
  },
})
