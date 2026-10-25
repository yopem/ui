import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorCursorOverlayItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("lexical"),
    editorDependency("@stylexjs/stylex"),
  ],
  description:
    "Paint native drag carets and retained text ranges without changing document state.",
  devDependencies: [],
  docs: {
    api: [
      "EditorCursorOverlay",
      "createEditorCursorOverlay",
      "EditorCursorOverlaySnapshot",
    ],
    usage:
      "Place EditorCursorOverlay inside EditorRoot beside EditorContent. The overlay uses the root owner document. Drag and drop stay native. Read-only transitions and document changes clear the paint. This feature supplies no AI authorization or acceptance action.",
  },
  files: [
    {
      path: "components/editor/cursor-overlay.tsx",
      target: "@/components/editor/cursor-overlay.tsx",
      type: "registry:ui",
    },
    {
      path: "components/editor/cursor-overlay-store.ts",
      target: "@/components/editor/cursor-overlay-store.ts",
      type: "registry:ui",
    },
  ],
  name: "editor-cursor-overlay",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: ["editor", "box"],
  title: "Editor cursor overlay",
  type: "registry:ui",
}
