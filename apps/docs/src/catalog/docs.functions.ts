import { componentDocs } from "@registry/docs"
import { createServerFn } from "@tanstack/react-start"

import { getDocumentationItems, getRequiredItems } from "./docs-data"
import { usageExamples } from "./usage"

const sources = import.meta.glob<string>(
  "../../../../packages/registry/src/**/*.{ts,tsx,css}",
  {
    query: "?raw",
    import: "default",
  },
)

export const getDocumentation = createServerFn({ method: "GET" })
  .validator((slug: string) => {
    if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug))
      throw new Error("Invalid component name")
    return slug
  })
  .handler(async ({ data: slug }) => {
    const items = getDocumentationItems(slug)
    const allItems = getRequiredItems(slug)
    const files = [
      ...new Map(
        allItems.flatMap((item) => item.files).map((file) => [file.path, file]),
      ).values(),
    ]
    return {
      title: items.map((item) => item.title).join(" + "),
      description: items.map((item) => item.description).join(" "),
      usage: usageExamples[slug] ?? "",
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
            target: `src/yopem/${file.path}`,
            content: await load(),
          }
        }),
      ),
      api: items
        .filter((item) => item.type === "registry:ui")
        .flatMap((item) => {
          const api = componentDocs.find((entry) => entry.name === item.name)
          if (!api) throw new Error(`Missing API reference: ${item.name}`)
          const names = new Set(api.parts.map((part) => part.name))
          return api.parts.map((part) => ({
            ...part,
            ...(part.aliasOf && names.has(part.aliasOf)
              ? { props: [], parameters: [], propVariants: [], signatures: [] }
              : {}),
            id: `${item.name}:${part.name}`,
          }))
        }),
    }
  })
