import { Box } from "@registry/components/ui/box"
import { Heading } from "@registry/components/ui/heading"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { createFileRoute, notFound } from "@tanstack/react-router"

import { ApiReference } from "@/catalog/api-reference"
import { PreviewPanel } from "@/catalog/catalog-ui"
import { CopyableCode } from "@/catalog/code-block"
import { DocumentationLayout } from "@/catalog/docs-layout"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/catalog/docs-page"
import { getEditorDocumentation } from "@/catalog/editor-documentation"
import { editorPartPreviews } from "@/catalog/editor-part-previews"
import { getEditorPart, editorPartLabel } from "@/catalog/editor-parts"
import { createSeo } from "@/lib/seo"

const toc = [
  { title: "Preview", url: "#preview", depth: 2 },
  { title: "Installation", url: "#installation", depth: 2 },
  { title: "Usage", url: "#usage", depth: 2 },
  { title: "API reference", url: "#api-reference", depth: 2 },
]

export const Route = createFileRoute("/editor/$slug")({
  loader: async ({ params }) => {
    const [data] = await Promise.all([
      getEditorDocumentation(params.slug),
      editorPartPreviews.get(params.slug)?.component.preload?.(),
    ])

    if (!data) throw notFound()

    return data
  },
  head: ({ params }) =>
    createSeo({
      title: `${getEditorPart(params.slug)?.name ?? "Editor"} · Yopem UI`,
      description:
        getEditorPart(params.slug)?.description ?? "Composable editor parts.",
      path: `/editor/${params.slug}`,
    }),
  component: EditorPartPage,
})

export function EditorPartPage() {
  const data = Route.useLoaderData()
  const { slug } = Route.useParams()
  const part = getEditorPart(slug)
  const preview = editorPartPreviews.get(slug)

  if (!part || !preview) throw notFound()

  return (
    <DocumentationLayout>
      <DocsPage toc={toc}>
        <DocsTitle>{editorPartLabel(part.name)}</DocsTitle>
        <Text>
          <code>{part.name}</code>
        </Text>
        <DocsDescription>{part.description}</DocsDescription>
        <DocsBody>
          <Stack>
            <Heading id="preview">Preview</Heading>
            <Box data-slot="editor-part-preview">
              <PreviewPanel
                preview={preview}
                title={null}
                source={data.usage}
              />
            </Box>
            <Heading id="installation">Installation</Heading>
            <CopyableCode
              language="shellscript"
              code="bunx --bun @yopem-ui/cli init"
              title="Initialize StyleX project with CLI"
            />
            <CopyableCode
              language="shellscript"
              code={data.installNames
                .map((name) => `bunx --bun @yopem-ui/cli add ${name}`)
                .join("\n")}
              title={`Install ${part.name} with CLI`}
            />
            <Heading id="usage">Usage</Heading>
            {data.notes.map((note) => (
              <Text key={note}>{note}</Text>
            ))}
            <CopyableCode code={data.usage} title={`${part.name} usage`} />
            <Heading id="api-reference">API reference</Heading>
            <ApiReference parts={data.api} />
          </Stack>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
