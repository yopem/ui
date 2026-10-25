import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorBlockBehaviorItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("@lexical/rich-text"),
    editorDependency("@lexical/utils"),
    editorDependency("lexical"),
  ],
  description:
    "Split native headings into paragraphs with a low-priority input rule.",
  devDependencies: [],
  docs: {
    api: ["EditorBlockBehaviorExtension"],
    usage:
      "Register EditorBlockBehaviorExtension in a stable extensions array. A collapsed editable heading Enter creates a paragraph for the new half. Higher-priority host handlers can preempt it. Other native keyboard rules remain unchanged. Native history, metadata preservation, nested contexts, and IME behavior require deferred validation.",
  },
  files: [
    {
      path: "components/editor/block-behavior.ts",
      target: "@/components/editor/block-behavior.ts",
      type: "registry:ui",
    },
  ],
  name: "editor-block-behavior",
  peerDependencies: [],
  registryDependencies: ["editor"],
  title: "Editor block behavior",
  type: "registry:ui",
}
