import { createFileRoute } from "@tanstack/react-router"

import { DocumentationLayout } from "@/catalog/docs-layout"
import { DocsDescription, DocsPage, DocsTitle } from "@/catalog/docs-page"
import { CoreEditorExamplesGallery } from "@/catalog/editor-examples-core"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/editor/examples/")({
  head: () =>
    createSeo({
      title: "Editor examples · Yopem UI",
      description: "Compose working Lexical editors with Yopem UI parts.",
      path: "/editor/examples",
    }),
  component: EditorExamplesIndex,
})

export function EditorExamplesIndex() {
  return (
    <DocumentationLayout>
      <DocsPage full>
        <DocsTitle>Editor examples</DocsTitle>
        <DocsDescription>
          Use these core compositions as starting points. Each example includes
          consumer source and its current limits. This gallery does not cover
          all public Plate examples.
        </DocsDescription>
        <CoreEditorExamplesGallery />
      </DocsPage>
    </DocumentationLayout>
  )
}
