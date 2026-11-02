/** Import aliases used in the copyable source files served by the registry. */
export const sourceImportReplacements = [
  [
    "@yopem-ui/editor/diagram/renderers/mermaid",
    "@/components/editor/diagram-renderers/mermaid.browser",
  ],
  [
    "@yopem-ui/editor/diagram/renderers/plantuml",
    "@/components/editor/diagram-renderers/plantuml.browser",
  ],
  [
    "@yopem-ui/editor/diagram/renderers/graphviz",
    "@/components/editor/diagram-renderers/graphviz",
  ],
  [
    "@yopem-ui/editor/diagram/renderers/flowchart",
    "@/components/editor/diagram-renderers/flowchart.browser",
  ],
  ["@yopem-ui/editor/diagram/model", "@/components/editor/diagram-model"],
  ["@yopem-ui/editor/diagram/state", "@/components/editor/diagram-state"],
  ["@yopem-ui/editor/diagram/render", "@/components/editor/diagram-render"],
  [
    "@yopem-ui/editor/diagram/extension",
    "@/components/editor/diagram-extension",
  ],
  ["@yopem-ui/editor/diagram/html", "@/components/editor/diagram-html"],
  ["@yopem-ui/editor/diagram", "@/components/editor/diagram"],
  ["@yopem-ui/editor/block-menu", "@/components/editor/block-menu-index"],
  ["@yopem-ui/editor/copilot/session", "@/components/editor/copilot-session"],
  ["@yopem-ui/editor/copilot", "@/components/editor/copilot"],
  [
    "@yopem-ui/editor/editable-card/model",
    "@/components/editor/editable-card-model",
  ],
  [
    "@yopem-ui/editor/editable-card/node",
    "@/components/editor/editable-card-node",
  ],
  ["@yopem-ui/editor/editable-card", "@/components/editor/editable-card"],
  [
    "@yopem-ui/editor/list-presentation/model",
    "@/components/editor/list-presentation-model",
  ],
  [
    "@yopem-ui/editor/list-presentation/extension",
    "@/components/editor/list-presentation-extension",
  ],
  [
    "@yopem-ui/editor/list-presentation",
    "@/components/editor/list-presentation",
  ],
  [
    "@yopem-ui/editor/block-selection",
    "@/components/editor/block-selection-index",
  ],
  [
    "@yopem-ui/editor/block-placeholder",
    "@/components/editor/block-placeholder",
  ],
  ["@yopem-ui/editor/docx/client", "@/components/editor/docx-controls"],
  ["@yopem-ui/editor/docx", "@/components/editor/docx"],
  ["@yopem-ui/editor/labels/model", "@/components/editor/labels-model"],
  ["@yopem-ui/editor/labels/node", "@/components/editor/labels-node"],
  ["@yopem-ui/editor/labels", "@/components/editor/labels"],
  ["@yopem-ui/editor/autoformat", "@/components/editor/autoformat"],
  ["@yopem-ui/editor/block-behavior", "@/components/editor/block-behavior"],
  ["@yopem-ui/editor/editing-rules", "@/components/editor/editing-rules"],
  ["@yopem-ui/editor/floating-toolbar", "@/components/editor/floating-toolbar"],
  ["@yopem-ui/editor/toolbar-menus", "@/components/editor/toolbar-menus"],
  [
    "@yopem-ui/editor/media-placeholder-model",
    "@/components/editor/media-placeholder-model",
  ],
  [
    "@yopem-ui/editor/media-placeholder-node",
    "@/components/editor/media-placeholder-node",
  ],
  [
    "@yopem-ui/editor/media-placeholder",
    "@/components/editor/media-placeholder",
  ],
  ["@yopem-ui/editor/search-model", "@/components/editor/search-model"],
  ["@yopem-ui/editor/search", "@/components/editor/search"],
  ["@yopem-ui/editor/csv/model", "@/components/editor/csv-model"],
  ["@yopem-ui/editor/columns/model", "@/components/editor/columns-model"],
  ["@yopem-ui/editor/date/model", "@/components/editor/date-model"],
  ["@yopem-ui/editor/json-duplicates", "@/components/editor/json-duplicates"],
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
    "@yopem-ui/editor/collaboration/native-model",
    "@/components/editor/collaboration-native-model",
  ],
  [
    "@yopem-ui/editor/collaboration/native",
    "@/components/editor/collaboration-native",
  ],
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
  [
    "@yopem-ui/editor/word-clipboard-model",
    "@/components/editor/word-clipboard-model",
  ],
  ["@yopem-ui/editor/word-clipboard", "@/components/editor/word-clipboard"],
  [
    "@yopem-ui/editor/document-export-html-to-image",
    "@/components/editor/document-export-html-to-image",
  ],
  [
    "@yopem-ui/editor/document-export-pdf",
    "@/components/editor/document-export-pdf",
  ],
  ["@yopem-ui/editor/document-export", "@/components/editor/document-export"],
  [
    "@yopem-ui/editor/cursor-overlay/store",
    "@/components/editor/cursor-overlay-store",
  ],
  ["@yopem-ui/editor/cursor-overlay", "@/components/editor/cursor-overlay"],
  ["@yopem-ui/editor/drawing/browser", "@/components/editor/drawing-browser"],
  ["@yopem-ui/editor/drawing/model", "@/components/editor/drawing-model"],
  ["@yopem-ui/editor/drawing", "@/components/editor/drawing"],
  ["@yopem-ui/editor/ai-menu-preview", "@/components/editor/ai-menu-preview"],
  ["@yopem-ui/editor/ai/menu", "@/components/editor/ai-menu"],
  ["@yopem-ui/editor/ai/client", "@/components/editor/ai-client"],
  ["@yopem-ui/editor/ai", "@/components/editor/ai-controls"],
  ["@yopem-ui/editor/server/ai", "@/lib/editor-ai"],
  ["@yopem-ui/editor/server/assets", "@/lib/editor-assets"],
  [
    "@yopem-ui/editor/server/native-grants",
    "@/lib/editor-collaboration/collaboration-native-grants",
  ],
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
      ? content
          .replaceAll('from "#serial-iteration"', 'from "./serial-iteration"')
          .replace(
            /from "\.\/(auth|document-[a-z0-9-]+)"/g,
            (_match, module: string) =>
              `from "@/lib/${module === "auth" ? "editor-auth" : "editor-store"}/${module}"`,
          )
      : content

  const nativeGrantSource =
    path === "lib/editor-collaboration/collaboration-native-grants.ts"
      ? serverSource.replaceAll(
          'from "@yopem-ui/editor/collaboration/native-model"',
          'from "./collaboration-native-model"',
        )
      : serverSource

  const source = path.startsWith("lib/editor-store/")
    ? content
        .replaceAll('from "./auth"', 'from "@/lib/editor-auth/auth"')
        .replaceAll(
          'from "@yopem-ui/editor/json-duplicates"',
          'from "./json-duplicates"',
        )
    : nativeGrantSource

  return sourceImportReplacements.reduce(
    (result, [source, target]) => result.replaceAll(source, target),
    source,
  )
}
