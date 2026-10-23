import { createFileRoute } from "@tanstack/react-router"

import { EditorCodeExamples } from "@/catalog/editor-code-examples"
import { EditorCompositionExamples } from "@/catalog/editor-composition-examples"
import { EditorExamples } from "@/catalog/editor-examples"
import { EditorExtensionExamples } from "@/catalog/editor-extension-examples"
import { EditorStyleExample } from "@/catalog/editor-style-examples"
import { EditorTableExamples } from "@/catalog/editor-table-examples"
import { GuidePage } from "@/catalog/guide-content"
import EditorContent from "@/content/editor.mdx"
import editorSource from "@/content/editor.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/editor")({
  head: () =>
    createSeo({
      description:
        "Use the Lexical editor foundation for core rich text, lists, history, read-only content, and JSON output.",
      path: "/docs/editor",
      title: "Editor · Yopem UI",
    }),
  component: EditorGuide,
})

const components = {
  EditorCodeExamples,
  EditorExamples,
  EditorCompositionExamples,
  EditorExtensionExamples,
  EditorTableExamples,
  EditorStyleExample,
}

function EditorGuide() {
  return (
    <GuidePage
      title="Editor"
      description="Build core rich text editing with Lexical and StyleX. Store content as Lexical JSON."
      source={editorSource}
      Content={EditorContent}
      components={components}
    />
  )
}
