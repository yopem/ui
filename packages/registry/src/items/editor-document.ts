import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorDocumentItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("@lexical/headless"),
    editorDependency("@types/hast"),
    editorDependency("katex"),
    editorDependency("hast-util-from-html"),
    editorDependency("hast-util-to-html"),
    editorDependency("remark-parse"),
    editorDependency("remark-gfm"),
    editorDependency("remark-math"),
    editorDependency("remark-rehype"),
    editorDependency("rehype-remark"),
    editorDependency("remark-stringify"),
    editorDependency("unified"),
  ],
  description: "Adds validated JSON, HTML, Markdown, and static document I/O.",
  devDependencies: [],
  docs: {
    api: [
      "DocumentError",
      "documentLimits",
      "documentNodes",
      "DocumentFormat",
      "parseDocument",
      "importDocument",
      "exportDocument",
      "htmlDocument",
      "downloadDocument",
      "EditorDocumentClipboardExtension",
      "registerDocumentPaste",
      "streamMarkdown",
      "DocumentStatic",
    ],
    usage:
      "Import portable helpers from @/components/editor/document. Import DocumentStatic from @/components/editor/document/static. Register EditorDocumentClipboardExtension at root creation. Keep registerDocumentPaste cleanup in the host lifecycle. Register EditorBlocksExtension for live callouts and toggles. Register the math and mention nodes before importing those representations. Mention identities do not grant access. See /docs/editor.",
  },
  files: [
    ...["index.ts", "boundary.ts", "convert.ts", "state.ts", "static.tsx"].map(
      (file) => ({
        path: `components/editor/document/${file}`,
        target: `@/components/editor/document/${file}`,
        type: "registry:ui" as const,
      }),
    ),
    ...[
      "math-model.ts",
      "math-node.ts",
      "math-render.ts",
      "mention-codec.ts",
      "mention-node.ts",
    ].map((file) => ({
      path: `components/editor/${file}`,
      target: `@/components/editor/${file}`,
      type: "registry:ui" as const,
    })),
  ],
  name: "editor-document",
  peerDependencies: ["react@>=19 <20", "react-dom@>=19 <20"],
  registryDependencies: ["editor", "editor-blocks"],
  title: "Editor document",
  type: "registry:ui",
}
