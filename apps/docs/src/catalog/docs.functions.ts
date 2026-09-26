import { componentDocs } from "@registry/docs"
import { rewriteImports } from "@registry/source-files"
import { createServerFn } from "@tanstack/react-start"

import { getDocumentationItems, getRequiredItems } from "./docs-data"
import { usageSnippets } from "./usage"

const sources = import.meta.glob<string>(
  "../../../../packages/registry/src/**/*.{ts,tsx,css}",
  {
    query: "?raw",
    import: "default",
  },
)
const previewSources = import.meta.glob<string>("./previews/*.tsx", {
  query: "?raw",
  import: "default",
})

export const getDocumentation = createServerFn({ method: "GET" })
  .validator((slug: string) => {
    if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug))
      throw new Error("Invalid component name")
    return slug
  })
  .handler(async ({ data: slug }) => {
    const items = getDocumentationItems(slug)
    const previewLoader = previewSources[`./previews/${slug}.tsx`]
    const previewSource = previewLoader ? await previewLoader() : null
    const allItems = getRequiredItems(slug, previewSource ?? "")
    const files = [
      ...new Map(
        allItems.flatMap((item) => item.files).map((file) => [file.path, file]),
      ).values(),
    ]
    const api = items
      .filter((item) => item.type === "registry:ui")
      .flatMap((item) => {
        const reference = componentDocs.find(
          (entry) => entry.name === item.name,
        )
        if (!reference) throw new Error(`Missing API reference: ${item.name}`)
        const names = new Set(reference.parts.map((part) => part.name))
        return reference.parts.map((part) => ({
          ...part,
          ...(part.aliasOf && names.has(part.aliasOf)
            ? { props: [], parameters: [], propVariants: [], signatures: [] }
            : {}),
          id: `${item.name}:${part.name}`,
        }))
      })
    return {
      title: items.map((item) => item.title).join(" + "),
      description: items.map((item) => item.description).join(" "),
      usage: usageSnippets[slug] ?? "",
      previewSource,
      notes: items.flatMap((item) => {
        const doc = componentDocs.find((entry) => entry.name === item.name)
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
          const load = sources[`../../../../packages/registry/src/${file.path}`]
          if (!load) throw new Error(`Missing canonical source: ${file.path}`)
          return {
            path: file.path,
            target: `src/${file.path}`,
            content: rewriteImports(await load()),
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
  })
