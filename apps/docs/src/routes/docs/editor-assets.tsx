import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import EditorAssetsContent from "@/content/editor-assets.mdx"
import editorAssetsSource from "@/content/editor-assets.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/editor-assets")({
  head: () =>
    createSeo({
      description:
        "Store private editor assets with authenticated delivery and durable cleanup.",
      path: "/docs/editor-assets",
      title: "Editor assets · Yopem UI",
    }),
  component: EditorAssetsGuide,
})

export function EditorAssetsGuide() {
  return (
    <GuidePage
      title="Editor assets"
      description="Use private R2 or S3 with D1 or PostgreSQL. Keep credentials and scanners on your server."
      source={editorAssetsSource}
      Content={EditorAssetsContent}
    />
  )
}
