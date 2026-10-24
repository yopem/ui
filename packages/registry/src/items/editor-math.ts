import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorMathItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("katex"),
    editorDependency("@lexical/utils"),
    editorDependency("lexical"),
    editorDependency("zod"),
  ],
  description:
    "Adds optional native inline and block TeX equations to the Lexical editor.",
  devDependencies: [],
  docs: {
    api: [
      "EditorMathExtension",
      "EditorMathControls",
      "EditorMathControl",
      "EditorMathPreview",
      "EditorMathNode",
      "EditorMathValue",
      "SerializedEditorMathNode",
      "$createEditorMathNode",
      "$getSelectedEditorMath",
      "$insertEditorMath",
      "parseEditorMath",
      "editorMathSchema",
      "editorMathNodeSchema",
      "renderEditorMath",
      "editorMathToMarkdown",
      "editorMathFromMarkdown",
      "editorMathHTMLAttributes",
      "editorMathFromHTMLAttributes",
    ],
    usage:
      "Register EditorMathExtension in a stable extensions array. Compose EditorMathControls inside EditorToolbar. Import pure codecs from @/components/editor/math-model. KaTeX uses native MathML without CSS or font downloads. See /docs/editor.",
  },
  files: [
    "math.ts",
    "math-model.ts",
    "math-render.ts",
    "math-node.ts",
    "math-extension.ts",
    "math-controls.tsx",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  name: "editor-math",
  peerDependencies: ["react@>=19 <20", "react-dom@>=19 <20"],
  registryDependencies: ["editor", "dialog", "hstack", "textarea"],
  title: "Editor math",
  type: "registry:ui",
}
