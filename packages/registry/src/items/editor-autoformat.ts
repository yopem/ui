import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorAutoformatItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("@lexical/extension"),
    editorDependency("@lexical/markdown"),
    editorDependency("@lexical/rich-text"),
    editorDependency("lexical"),
  ],
  description:
    "Add native checklist, nested quote, rule, and smart text input shortcuts.",
  devDependencies: [],
  docs: {
    api: ["EditorAutoformatExtension"],
    usage:
      "Register EditorAutoformatExtension in a stable root extensions array. It adds non-base transformers without repeating the base Markdown registration. Code keeps literal text. Fractions require a word boundary. Guillemet shortcuts require preceding text or whitespace. Native history, IME, clipboard, and overlapping pattern behavior need host validation.",
  },
  files: [
    {
      path: "components/editor/autoformat.ts",
      target: "@/components/editor/autoformat.ts",
      type: "registry:ui",
    },
  ],
  name: "editor-autoformat",
  peerDependencies: [],
  registryDependencies: ["editor"],
  title: "Editor input shortcuts",
  type: "registry:ui",
}
