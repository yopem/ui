import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorMediaPlaceholderItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("@lexical/utils"),
    editorDependency("lexical"),
    editorDependency("zod"),
  ],
  description:
    "Adds bounded native media upload placeholders and typed inline notifications.",
  devDependencies: [],
  docs: {
    api: [
      "createEditorMediaPlaceholder",
      "createMediaPlaceholderExtension",
      "EditorMediaPlaceholderController",
      "MediaPlaceholderSnapshot",
      "MediaPlaceholderFailure",
      "MediaPlaceholderTargetProps",
      "MediaPlaceholderKind",
      "SerializedMediaPlaceholder",
      "MediaPlaceholderNode",
      "$createMediaPlaceholderNode",
      "mediaPlaceholderNodeSchema",
      "MEDIA_PLACEHOLDER_FILE_LIMIT",
      "MEDIA_PLACEHOLDER_LIMIT",
      "useMediaPlaceholder",
      "MediaPlaceholderElement",
      "MediaPlaceholderStatus",
      "MediaUploadNotification",
      "MediaPlaceholderFileInput",
      "MediaPlaceholderRetryButton",
      "MediaPlaceholderCancelButton",
      "MediaPlaceholderRemoveButton",
      "MediaPlaceholderInsertButton",
    ],
    usage:
      "Create one stable controller per EditorRoot with an explicit host upload callback. Register MediaExtension and createMediaPlaceholderExtension(controller) at root creation. Compose MediaPlaceholderInsertButton inside EditorToolbar. The node renders composable file, progress, typed failure, retry, cancel, and remove controls. Compose MediaUploadNotification beside EditorContent. Use controller.configure when host authentication or the callback changes. Cancel aborts active work but keeps its slot until the callback settles. Each root permits one active task, 16 placeholders, and nonempty files up to 16 MiB. The host must enforce authorization, content, and quota limits. No automatic upload, retry, or fetch is supplied. No file-upload paste or drop handler is supplied. The extension checks clipboard node insertion for placeholder limits and valid placement. Insertion, successful replacement, and removal each use separate history steps. Progress, failure, and cancellation add no history steps. Undo invalidates active work. Redo and reload never restart an upload. Restored placeholders retain only media kind and require explicit file selection. Failure retry retains one File in memory until cancellation, document changes, or cleanup. An active upload holds a File in memory. The host callback receives the File and can retain or copy it, including after settlement. Successful replacement stores the file name and URL in media JSON and tagged HTML. JSON omission does not erase memory or remote copies. Document, non-null caret, read-only, root, and host changes invalidate active work. Callback cancellation does not prove that remote storage stopped. See /editor/media-placeholder-element.",
  },
  files: [
    "media-placeholder.tsx",
    "media-placeholder-controller.ts",
    "media-placeholder-model.ts",
    "media-placeholder-node.ts",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  name: "editor-media-placeholder",
  peerDependencies: [registryDependency("react")],
  registryDependencies: [
    "editor-media",
    "box",
    "button",
    "fieldset",
    "input",
    "progress",
    "stack",
    "text",
    "wrap",
  ],
  title: "Editor media placeholder",
  type: "registry:ui",
}
