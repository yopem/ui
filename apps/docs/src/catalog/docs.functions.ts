import type { componentDocs } from "@registry/docs"

import { rewriteImports } from "@registry/source-files"
import { z } from "zod"

import { getDocumentationItems, getRequiredItems } from "./docs-data"
import {
  getEditorPreviewSource,
  type EditorPreviewFixture,
} from "./editor-preview-source"
import { usageSnippets } from "./usage"

const sources = import.meta.glob<string>(
  [
    "../../../../packages/registry/src/**/*.{ts,tsx,css}",
    "../../../../packages/editor/src/**/*.{ts,tsx,sql}",
    "../../../../packages/editor/LICENSE.md",
  ],
  {
    query: "?raw",
    import: "default",
  },
)

const previewSources = import.meta.glob<string>("./previews/*.tsx", {
  query: "?raw",
  import: "default",
})

const completeEditorPreviews = new Map<
  string,
  [path: string, fixture?: EditorPreviewFixture]
>([
  ["editor-code", ["./editor-previews/code-preset.tsx"]],
  ["editor-block-selection", ["./editor-previews/block-selection.tsx"]],
  ["editor-review", ["./editor-preview-compositions/review.tsx"]],
  ["editor-media", ["./editor-preview-compositions/media.tsx"]],
  ["editor-columns", ["./editor-example-compositions/column.tsx", "column"]],
  ["editor-date", ["./editor-example-compositions/date.tsx", "date"]],
  [
    "editor-footnotes",
    ["./editor-example-compositions/footnote.tsx", "footnote"],
  ],
  ["editor-toc", ["./editor-example-compositions/toc.tsx", "toc"]],
  ["editor-csv", ["./editor-examples/public-csv.tsx"]],
  ["editor-word-clipboard", ["./editor-examples/public-word-clipboard.tsx"]],
  ["editor-search", ["./editor-preview-compositions/search.tsx"]],
  [
    "editor-list-presentation",
    ["./editor-examples/public-list-presentation.tsx"],
  ],
  ["editor-editable-card", ["./editor-examples/public-editable-voids.tsx"]],
  ["editor-block-menu", ["./editor-examples/public-block-menu.tsx"]],
  ["editor-copilot", ["./editor-examples/public-copilot.tsx"]],
  ["editor-diagram", ["./editor-preview-compositions/diagram.tsx"]],
  ["editor-ai-menu", ["./editor-examples/public-ai.tsx"]],
  ["editor-docx", ["./editor-examples/public-docx.tsx"]],
  ["editor-labels", ["./editor-examples/public-labels.tsx"]],
  ["editor-block-placeholder", ["./editor-examples/public-placeholder.tsx"]],
  ["editor-autoformat", ["./editor-examples/public-autoformat.tsx"]],
  ["editor-block-behavior", ["./editor-examples/public-plugin-rules.tsx"]],
  ["editor-editing-rules", ["./editor-examples/public-editing-rules.tsx"]],
  [
    "editor-floating-toolbar",
    ["./editor-examples/public-floating-toolbar.tsx"],
  ],
  ["editor-cursor-overlay", ["./editor-examples/public-cursors.tsx"]],
])

const documentationSources = import.meta.glob<(typeof componentDocs)[number]>(
  "../../public/r/docs/*.json",
  { import: "default" },
)

const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, { error: "Invalid component name" })

export async function getDocumentation({ data }: { data: string }) {
  const slug = slugSchema.parse(data)
  const items = getDocumentationItems(slug)

  const docs = await Promise.all(
    items.map((item) => {
      const load = documentationSources[`../../public/r/docs/${item.name}.json`]

      if (!load) throw new Error(`Missing API reference: ${item.name}`)

      return load()
    }),
  )

  const previewLoader = previewSources[`./previews/${slug}.tsx`]
  const completePreview = completeEditorPreviews.get(slug)

  const previewSource = completePreview
    ? await getEditorPreviewSource(...completePreview)
    : previewLoader
      ? rewriteImports(await previewLoader())
      : null

  const allItems = getRequiredItems(slug, previewSource ?? "")

  const files = [
    ...new Map(
      allItems.flatMap((item) => item.files).map((file) => [file.path, file]),
    ).values(),
  ]

  const api = items
    .filter((item) => item.type === "registry:ui" || item.name === "editor-ai")
    .flatMap((item) => {
      const reference = docs.find((entry) => entry.name === item.name)

      if (!reference) throw new Error(`Missing API reference: ${item.name}`)
      const names = new Set(reference.parts.map((part) => part.name))

      return reference.parts.map((part) => {
        const apiPart = { ...part }

        if (part.aliasOf && names.has(part.aliasOf)) {
          apiPart.props = []
          apiPart.parameters = []
          apiPart.propVariants = []
          apiPart.signatures = []
        }

        return {
          ...apiPart,
          id: `${item.name}:${part.name}`,
        }
      })
    })

  return {
    title: items.map((item) => item.title).join(" + "),
    description: items.map((item) => item.description).join(" "),
    usage: usageSnippets.get(slug) ?? "",
    previewSource,
    notes: items.flatMap((item) => {
      const doc = docs.find((entry) => entry.name === item.name)

      return doc ? [doc.usage, ...doc.notes] : []
    }),
    dependencies: [
      ...new Set(allItems.flatMap((item) => item.dependencies)),
    ].sort(),
    devDependencies: [
      ...new Set(allItems.flatMap((item) => item.devDependencies)),
    ].sort(),
    peerDependencies: [
      ...new Set(allItems.flatMap((item) => item.peerDependencies)),
    ].sort(),
    installNames: items.map((item) => item.name),
    requiredItems: allItems.map((item) => ({
      name: item.name,
      title: item.title,
    })),
    files: await Promise.all(
      files.map(async (file) => {
        const sourcePath =
          file.path === "components/editor/LICENSE.md"
            ? "../../../../packages/editor/LICENSE.md"
            : file.path.startsWith("lib/editor-ai/")
              ? `../../../../packages/editor/src/server/ai/${file.path.slice("lib/editor-ai/".length)}`
              : file.path.startsWith("lib/editor-collaboration/")
                ? `../../../../packages/editor/src/server/${file.path === "lib/editor-collaboration/index.ts" ? "collaboration-index.ts" : file.path.slice("lib/editor-collaboration/".length)}`
                : file.path.startsWith("lib/editor-assets/")
                  ? `../../../../packages/editor/src/server/${file.path === "lib/editor-assets/index.ts" ? "asset-index.ts" : file.path.slice("lib/editor-assets/".length)}`
                  : file.path.startsWith("lib/editor-store/")
                    ? `../../../../packages/editor/src/server/${file.path === "lib/editor-store/index.ts" ? "document-index.ts" : file.path.slice("lib/editor-store/".length)}`
                    : file.path === "lib/editor-auth/index.ts"
                      ? "../../../../packages/editor/src/server/auth-index.ts"
                      : file.path.startsWith("lib/editor-auth/")
                        ? `../../../../packages/editor/src/server/${file.path.slice("lib/editor-auth/".length)}`
                        : file.path.startsWith("components/editor/")
                          ? `../../../../packages/editor/src/${file.path.slice("components/editor/".length)}`
                          : `../../../../packages/registry/src/${file.path}`

        const load = sources[sourcePath]

        if (!load) throw new Error(`Missing canonical source: ${file.path}`)

        return {
          path: file.path,
          target: `src/${file.path}`,
          content: rewriteImports(await load(), file.path),
        }
      }),
    ),
    api: api.map((part) => ({
      ...part,
      props: part.props.filter(
        (prop) => !prop.source.startsWith("@types/react"),
      ),
    })),
  }
}
