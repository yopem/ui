import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorDrawingItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("lexical"),
    editorDependency("@lexical/utils"),
    editorDependency("@stylexjs/stylex"),
    editorDependency("zod"),
    editorDependency("@excalidraw/excalidraw"),
  ],
  description:
    "Edit bounded native drawing scenes through an explicitly configured Excalidraw browser runtime.",
  devDependencies: [],
  docs: {
    api: [
      "EditorDrawingExtension",
      "EditorDrawingInsertButton",
      "registerEditorDrawingRuntime",
      "EditorDrawingNode",
      "parseEditorDrawingScene",
    ],
    usage:
      "Register EditorDrawingExtension in a stable root array. Load the separate browser entry with approved same-origin SDK assets and its stylesheet. Register one drawing runtime per root and run its cleanup. Source, SDK, dependency-audit, CSP, font, SVG and accessibility acceptance remain required. Generic document conversion does not support drawing nodes.",
  },
  files: [
    {
      path: "components/editor/drawing.ts",
      target: "@/components/editor/drawing.ts",
      type: "registry:ui",
    },
    {
      path: "components/editor/drawing-model.ts",
      target: "@/components/editor/drawing-model.ts",
      type: "registry:ui",
    },
    {
      path: "components/editor/drawing-node.tsx",
      target: "@/components/editor/drawing-node.tsx",
      type: "registry:ui",
    },
    {
      path: "components/editor/drawing-extension.ts",
      target: "@/components/editor/drawing-extension.ts",
      type: "registry:ui",
    },
    {
      path: "components/editor/drawing-browser.tsx",
      target: "@/components/editor/drawing-browser.tsx",
      type: "registry:ui",
    },
    {
      path: "components/editor/LICENSE.md",
      target: "@/components/editor/LICENSE.md",
      type: "registry:lib",
    },
  ],
  name: "editor-drawing",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: [
    "editor",
    "editor-diagram",
    "box",
    "button",
    "checkbox",
    "dialog",
    "input",
    "label",
    "stack",
    "text",
  ],
  title: "Editor drawing",
  type: "registry:ui",
}
