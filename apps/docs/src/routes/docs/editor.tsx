import { createFileRoute } from "@tanstack/react-router"

import { EditorAiExample } from "@/catalog/editor-ai-example"
import { EditorBlocksExample } from "@/catalog/editor-blocks-example"
import { EditorCodeExamples } from "@/catalog/editor-code-examples"
import { EditorCompositionExamples } from "@/catalog/editor-composition-examples"
import { EditorDocumentExamples } from "@/catalog/editor-document-examples"
import { EditorExamples } from "@/catalog/editor-examples"
import { PublicCodeDrawingExample as EditorDiagramExample } from "@/catalog/editor-examples/public-code-drawing"
import { EditorExtensionExamples } from "@/catalog/editor-extension-examples"
import { EditorStyleExample } from "@/catalog/editor-style-examples"
import { EditorTableExamples } from "@/catalog/editor-table-examples"
import {
  EditorTypeaheadExample,
  EditorHTTPTypeaheadExample,
  EditorEmojiMenuExample,
} from "@/catalog/editor-typeahead-examples"
import { GuidePage } from "@/catalog/guide-content"
import { Preview as EditorColumnsExample } from "@/catalog/previews/editor-columns"
import { Preview as EditorDateExample } from "@/catalog/previews/editor-date"
import { Preview as EditorReviewExample } from "@/catalog/previews/editor-review"
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
  EditorDiagramExample,
  EditorAiExample,
  EditorBlocksExample,
  EditorReviewExample,
  EditorColumnsExample,
  EditorDateExample,
  EditorCodeExamples,
  EditorExamples,
  EditorDocumentExamples,
  EditorCompositionExamples,
  EditorExtensionExamples,
  EditorTableExamples,
  EditorStyleExample,
  EditorTypeaheadExample,
  EditorHTTPTypeaheadExample,
  EditorEmojiMenuExample,
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
