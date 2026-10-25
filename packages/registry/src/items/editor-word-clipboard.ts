import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorWordClipboardItem: SourceItem = {
  name: "editor-word-clipboard",
  title: "Editor Word clipboard",
  type: "registry:ui",
  categories: ["input"],
  description:
    "Normalize a bounded Word HTML subset before native fragment insertion.",
  dependencies: [
    editorDependency("@lexical/clipboard"),
    editorDependency("@lexical/extension"),
    editorDependency("lexical"),
    editorDependency("hast-util-to-html"),
    editorDependency("zod"),
    editorDependency("@types/hast"),
  ],
  devDependencies: [],
  peerDependencies: [],
  registryDependencies: [
    "editor-document",
    "editor-list-presentation",
    "editor-media",
    "field",
    "form",
    "heading",
  ],
  files: ["word-clipboard.ts", "word-clipboard-model.ts"].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  docs: {
    api: [
      "EditorWordClipboardExtension",
      "registerWordClipboardPaste",
      "normalizeWordClipboardHTML",
      "isWordClipboardHTML",
      "WordClipboardImageResolver",
      "WordClipboardImage",
      "RegisterWordClipboardPasteOptions",
    ],
    usage:
      "Register EditorWordClipboardExtension in a stable root extension array. Call registerDocumentPaste and registerWordClipboardPaste after creation. Keep both cleanups in the host lifecycle. Native Lexical JSON and host MIME policies keep priority. This is a bounded Word HTML subset, not DOCX file conversion or full Word fidelity. Images reject unless a synchronous host resolver returns validated media. Never fetch an untrusted image source automatically. Register MediaExtension before inserting resolved images. Keep resolver configuration stable until remount. Invalid or stale fragments must keep current content. Runtime acceptance remains deferred.",
  },
}
