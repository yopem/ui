import { createFileRoute } from "@tanstack/react-router"

import { getCoreEditorExamplesMarkdown } from "@/catalog/editor-examples-core"
import { markdownResponse } from "@/lib/plain-text"

export const Route = createFileRoute("/editor/examples.md")({
  server: {
    handlers: {
      GET: () => markdownResponse(getCoreEditorExamplesMarkdown()),
    },
  },
})
