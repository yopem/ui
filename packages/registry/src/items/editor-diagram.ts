import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorDiagramItem: SourceItem = {
  name: "editor-diagram",
  title: "Editor diagrams",
  type: "registry:ui",
  categories: ["input"],
  description:
    "Adds native code diagrams with explicit renderers and bounded SVG previews.",
  dependencies: (
    ["@lexical/code", "@lexical/html", "lexical", "zod"] as const
  ).map(editorDependency),
  devDependencies: [],
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: ["editor", "native-select"],
  files: [
    "diagram.ts",
    "diagram-controls.tsx",
    "diagram-auto-render.ts",
    "diagram-extension.ts",
    "diagram-html.ts",
    "diagram-presentation.ts",
    "diagram-model.ts",
    "diagram-png.ts",
    "diagram-render.ts",
    "diagram-state.ts",
    "diagram-store.ts",
    "code-selection.ts",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui" as const,
  })),
  docs: {
    api: [
      "EditorDiagramRoot",
      "EditorDiagramToolbar",
      "EditorDiagramInsertButton",
      "EditorDiagramKindSelect",
      "EditorDiagramViewModeSelect",
      "EditorDiagramRenderButton",
      "EditorDiagramDownloadButton",
      "EditorDiagramDeleteButton",
      "EditorDiagramStatus",
      "EditorDiagramPreview",
      "EditorDiagramExtension",
      "createEditorDiagramHttpRenderer",
      "createEditorDiagramHTMLConfig",
      "createEditorDiagramMetadata",
      "createEditorDiagramStore",
      "renderEditorDiagram",
      "sanitizeEditorDiagramSvg",
      "assertEditorDiagramRenderActive",
      "getEditorDiagramCodeLanguage",
      "EditorDiagramRenderInput",
      "EditorDiagramRenderer",
      "EditorDiagramKind",
      "EditorDiagramMetadata",
      "EditorDiagramRenderers",
    ],
    usage:
      "Register EditorDiagramExtension in a stable root extension array. Compose EditorDiagramRoot and its controls inside EditorRoot. Supply explicit renderers. No default engine or endpoint exists. Source stays visible until a matching SVG image loads. Optional automatic rendering includes saved and read-only nodes. Download the selected cached preview as SVG or bounded PNG. Registered document readers preserve diagram metadata without rendering it.",
  },
}
