import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

function rendererItem(
  name: string,
  title: string,
  dependency: Parameters<typeof editorDependency>[0],
  entry: string,
  api: string,
  helpers: readonly string[] = [],
): SourceItem {
  return {
    name,
    title,
    type: "registry:lib",
    categories: ["input"],
    description: `Adds an optional ${title} adapter for editor diagram rendering.`,
    dependencies: [editorDependency(dependency)],
    devDependencies: [],
    peerDependencies: [],
    registryDependencies: ["editor-diagram"],
    files: [entry, ...helpers].map((file) => ({
      path: `components/editor/diagram-renderers/${file}`,
      target: `@/components/editor/diagram-renderers/${file}`,
      type: "registry:lib" as const,
    })),
    docs: {
      api: [api],
      usage:
        "Import this adapter only from a browser-only entry. Supply it to EditorDiagramRoot through renderers. Use renderEditorDiagram for direct calls. It checks deadlines and sanitizes returned SVG. Source filters are not SDK sandboxes. Cancellation cannot stop synchronous engine work. SSR routes must use an explicit authorized host renderer instead.",
    },
  }
}

export const editorDiagramMermaidItem = rendererItem(
  "editor-diagram-mermaid",
  "Mermaid",
  "mermaid",
  "mermaid.browser.ts",
  "editorDiagramMermaidRenderer",
  ["source-policy.ts"],
)

export const editorDiagramPlantUmlItem = rendererItem(
  "editor-diagram-plantuml",
  "PlantUML",
  "@plantuml/core",
  "plantuml.browser.ts",
  "editorDiagramPlantUmlRenderer",
  ["source-policy.ts", "plantuml-types.d.ts", "plantuml-types.js"],
)

export const editorDiagramGraphvizItem = rendererItem(
  "editor-diagram-graphviz",
  "Graphviz",
  "@hpcc-js/wasm-graphviz",
  "graphviz.ts",
  "editorDiagramGraphvizRenderer",
)

export const editorDiagramFlowchartItem = rendererItem(
  "editor-diagram-flowchart",
  "Flowchart.js",
  "flowchart.js",
  "flowchart.browser.ts",
  "editorDiagramFlowchartRenderer",
  ["source-policy.ts"],
)
