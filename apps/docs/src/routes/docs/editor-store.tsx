import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import EditorStoreContent from "@/content/editor-store.mdx"
import editorStoreSource from "@/content/editor-store.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/editor-store")({
  head: () =>
    createSeo({
      description:
        "Store authenticated editor snapshots with conditional writes, durable receipts, and tombstones.",
      path: "/docs/editor-store",
      title: "Editor document storage · Yopem UI",
    }),
  component: EditorStoreGuide,
})

export function EditorStoreGuide() {
  return (
    <GuidePage
      title="Editor document storage"
      description="Use D1 or PostgreSQL. Keep authentication and document policy in your host application."
      source={editorStoreSource}
      Content={EditorStoreContent}
    />
  )
}
