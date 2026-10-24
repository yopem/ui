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
      "Import parts from @/components/editor/toc. Register EditorTocExtension in a stable root extension array. Compose controls inside EditorToolbar. The table of contents derives entries from current document headings. Navigation stays within the current editor. Register EditorTocNode in every reader that loads this document type. Generic editor-document conversion does not yet support table-of-contents nodes.",
  },
}
