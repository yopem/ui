import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorTocItem: SourceItem = {
  name: "editor-toc",
  title: "Editor table of contents",
  type: "registry:ui",
  categories: ["input"],
  description:
    "Adds a native table of contents that follows document headings.",
  dependencies: [
    editorDependency("@lexical/rich-text"),
    editorDependency("@lexical/utils"),
    editorDependency("hast-util-from-html"),
    editorDependency("zod"),
  ],
  devDependencies: [],
  peerDependencies: [],
  registryDependencies: ["editor", "button", "hstack", "list", "text"],
  files: [
    "toc.ts",
    "toc-model.ts",
    "toc-node.tsx",
    "toc-runtime.ts",
    "toc-state.ts",
    "toc-extension.ts",
    "toc-controls.tsx",
    "toc-clipboard.ts",
    "toc-html.ts",
    "dom.ts",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  docs: {
    api: [
      "EditorTocExtension",
      "EditorTocControls",
      "EditorTocControlsProps",
      "EditorTocInsertControl",
      "EditorTocRemoveControl",
      "editorTocSlashCommand",
      "EditorTocNode",
      "parseEditorTocNode",
      "validateEditorTocJSON",
      "validateEditorTocHTML",
    ],
    usage:
      "Import parts from @/components/editor/toc. Register EditorTocExtension in a stable root extension array. Compose controls inside EditorToolbar. Live contents show the first 500 nonempty headings in preorder. Titles normalize whitespace and truncate to 256 UTF-16 code units. Navigation stays within the current editor. Register EditorTocNode in live readers. The optional editor-document reader retains validated contents nodes. Portable document export uses all headings and full text, subject to document limits. It uses canonical document-scoped IDs, not live editor-scoped IDs. Portable HTML input requires complete canonical heading links. Native TOC HTML can fail this check.",
  },
}
