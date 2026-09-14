import { componentDocs } from "@registry/docs"
import { createServerFn } from "@tanstack/react-start"

import { getDocumentationItems, getRequiredItems } from "./docs-data"
import { selectExamples } from "./select-examples"
import { usageExamples } from "./usage"

const sources = import.meta.glob<string>(
  "../../../../packages/registry/src/**/*.{ts,tsx,css}",
  {
    query: "?raw",
    import: "default",
  },
)
const demoSources = import.meta.glob<string>(
  "../components/demos/stylex/*.tsx",
  {
    query: "?raw",
    import: "default",
  },
)

const docsImportReplacements = [
  ["@registry/components/ui/", "@/components/ui/"],
  ["@registry/hooks/", "@/hooks/"],
  ["@registry/lib/", "@/lib/"],
  ["@registry/styles/", "@/styles/"],
  ["@registry/theme/", "@/theme/"],
] as const

function prepareSource(content: string) {
  return docsImportReplacements.reduce(
    (source, [from, to]) => source.replaceAll(from, to),
    content,
  )
}

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
    const examples = await Promise.all(
      Object.entries(demoSources)
        .filter(([path]) => path.includes(`/p-${slug}-`))
        .map(async ([path, load]) => ({
          name:
            path
              .split("/")
              .at(-1)
              ?.replace(/\.tsx$/, "") ?? path,
          source: await load(),
        })),
    )
    examples.sort(
      (left, right) =>
        Number(left.name.split("-").at(-1)) -
        Number(right.name.split("-").at(-1)),
    )
    return {
      title: items.map((item) => item.title).join(" + "),
      description: items.map((item) => item.description).join(" "),
      usage: usageExamples[slug] ?? "",
      examples: selectExamples(api, examples).map((group) => ({
        ...group,
        examples: group.examples.map((example) => ({
          ...example,
          source: example.source
            .replaceAll("@/components/ui/stylex/", "@/components/ui/")
            .replaceAll("@/lib/table-wrapper", "@tanstack/react-table"),
        })),
      })),
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
            target: `src/${file.path}`,
            content: prepareSource(await load()),
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
