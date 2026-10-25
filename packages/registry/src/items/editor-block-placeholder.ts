import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorBlockPlaceholderItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("lexical"),
    editorDependency("@lexical/rich-text"),
    editorDependency("zod"),
    editorDependency("@stylexjs/stylex"),
  ],
  description:
    "Show a selected empty block hint without inserting document content.",
  devDependencies: [],
  docs: {
    api: [
      "EditorBlockPlaceholder",
      "EditorBlockPlaceholderProps",
      "EditorBlockPlaceholderLabels",
    ],
    usage:
      "Place one EditorBlockPlaceholder beside EditorContent inside EditorRoot. Keep labels fixed until unmount. Hints apply only to focused, empty top-level elements. Native content, history, and serializers do not receive placeholder text.",
  },
  files: [
    {
      path: "components/editor/block-placeholder.tsx",
      target: "@/components/editor/block-placeholder.tsx",
      type: "registry:ui",
    },
  ],
  name: "editor-block-placeholder",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: ["editor"],
  title: "Editor block placeholder",
  type: "registry:ui",
}
