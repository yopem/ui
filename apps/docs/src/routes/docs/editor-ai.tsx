import { createFileRoute } from "@tanstack/react-router"

import { EditorAiExample } from "@/catalog/editor-ai-example"
import { GuidePage } from "@/catalog/guide-content"
import EditorAiContent from "@/content/editor-ai.mdx"
import editorAiSource from "@/content/editor-ai.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/editor-ai")({
  head: () =>
    createSeo({
      description:
        "Configure authenticated server AI and review untrusted editor proposals.",
      path: "/docs/editor-ai",
      title: "Editor AI · Yopem UI",
    }),
  component: EditorAiGuide,
})

const components = { EditorAiExample }

export function EditorAiGuide() {
  return (
    <GuidePage
      title="Editor AI"
      description="Supply your host services. Review plain text before approval."
      source={editorAiSource}
      Content={EditorAiContent}
      components={components}
    />
  )
}
