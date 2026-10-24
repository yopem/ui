import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import EditorCollaborationContent from "@/content/editor-collaboration.mdx"
import editorCollaborationSource from "@/content/editor-collaboration.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/editor-collaboration")({
  head: () =>
    createSeo({
      description:
        "Configure authenticated editor collaboration with Durable Objects and D1 or PostgreSQL and host WebSocket adapters.",
      path: "/docs/editor-collaboration",
      title: "Editor collaboration · Yopem UI",
    }),
  component: EditorCollaborationGuide,
})

export function EditorCollaborationGuide() {
  return (
    <GuidePage
      title="Editor collaboration"
      description="Connect native Lexical collaboration to explicit host authentication, document policy, and durable storage."
      source={editorCollaborationSource}
      Content={EditorCollaborationContent}
    />
  )
}
