/** Import aliases used in the copyable source files served by the registry. */
export const sourceImportReplacements = [
  [
    "@yopem-ui/editor/block-selection",
    "@/components/editor/block-selection-index",
  ],
  [
    "@yopem-ui/editor/block-placeholder",
    "@/components/editor/block-placeholder",
  ],
  ["@yopem-ui/editor/editing-rules", "@/components/editor/editing-rules"],
  ["@yopem-ui/editor/floating-toolbar", "@/components/editor/floating-toolbar"],
  ["@yopem-ui/editor/search-model", "@/components/editor/search-model"],
  ["@yopem-ui/editor/search", "@/components/editor/search"],
  ["@yopem-ui/editor/csv/model", "@/components/editor/csv-model"],
  ["@yopem-ui/editor/columns/model", "@/components/editor/columns-model"],
  ["@yopem-ui/editor/date/model", "@/components/editor/date-model"],
  ["@yopem-ui/editor/document/static", "@/components/editor/document/static"],
  ["@yopem-ui/editor/document", "@/components/editor/document"],
  [
    "@yopem-ui/editor/block-presentation",
    "@/components/editor/block-presentation",
  ],
  [
    "@yopem-ui/editor/table-presentation-schema",
    "@/components/editor/table-presentation-schema",
  ],
  ["@yopem-ui/editor/math/model", "@/components/editor/math-model"],
  [
    "@yopem-ui/editor/server/collaboration/bun",
    "@/lib/editor-collaboration/collaboration-bun",
  ],
  [
    "@yopem-ui/editor/server/collaboration/node",
    "@/lib/editor-collaboration/collaboration-node",
  ],
  [
    "@yopem-ui/editor/server/collaboration/worker",
    "@/lib/editor-collaboration/collaboration-do",
  ],
  ["@yopem-ui/editor/server/collaboration", "@/lib/editor-collaboration"],
  ["@yopem-ui/editor/ai/client", "@/components/editor/ai-client"],
  ["@yopem-ui/editor/ai", "@/components/editor/ai-controls"],
  ["@yopem-ui/editor/server/ai", "@/lib/editor-ai"],
  ["@yopem-ui/editor/server/assets", "@/lib/editor-assets"],
  ["@yopem-ui/editor/server", "@/lib/editor-auth"],
  ["@yopem-ui/editor/typeahead", "@/components/editor/typeahead-index"],
  ["@yopem-ui/editor", "@/components/editor"],
  ["@registry/components/ui/", "@/components/ui/"],
  ["@registry/hooks/", "@/hooks/"],
  ["@registry/lib/", "@/lib/"],
  ["@registry/styles/", "@/styles/"],
  ["@registry/theme/", "@/theme/"],
] as const

export function rewriteImports(content: string, path = "") {
  const serverSource =
    path.startsWith("lib/editor-collaboration/") ||
    path.startsWith("lib/editor-assets/")
      ? content.replace(
          /from "\.\/(auth|document-[a-z0-9-]+)"/g,
          (_match, module: string) =>
            `from "@/lib/${module === "auth" ? "editor-auth" : "editor-store"}/${module}"`,
        )
      : content

  const source = path.startsWith("lib/editor-store/")
    ? content.replaceAll('from "./auth"', 'from "@/lib/editor-auth/auth"')
    : serverSource

  return sourceImportReplacements.reduce(
    (result, [source, target]) => result.replaceAll(source, target),
    source,
  )
}
