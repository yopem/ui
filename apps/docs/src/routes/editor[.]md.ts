import { createFileRoute } from "@tanstack/react-router"

import { editorParts } from "@/catalog/editor-parts"
import { markdownResponse } from "@/lib/plain-text"

export const Route = createFileRoute("/editor.md")({
  server: {
    handlers: {
      GET: () =>
        markdownResponse(
          `# Editor\n\n${editorParts.map((part) => `- [${part.name}](/editor/${part.slug}.md): ${part.description}`).join("\n")}\n`,
        ),
    },
  },
})
