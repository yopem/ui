import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorMediaItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("@lexical/utils"),
    editorDependency("@stylexjs/stylex"),
    editorDependency("lexical"),
    editorDependency("zod"),
  ],
  description:
    "Adds optional image, video, audio, file, and provider media to the Lexical editor.",
  devDependencies: [],
  docs: {
    api: [
      "MediaInsertControl",
      "MediaContent",
      "MediaExtension",
      "MediaNode",
      "SerializedMediaNode",
      "MediaData",
      "MediaInput",
      "MediaKind",
      "MediaUpload",
      "MediaUploadSnapshot",
      "$createMediaNode",
      "$insertMedia",
      "mediaKinds",
      "mediaSchema",
      "parseMedia",
      "parseProvider",
      "safeMediaUrl",
      "serializeMediaHtml",
      "createMediaUpload",
    ],
    usage:
      "Register MediaExtension in a stable extensions array. Compose MediaInsertControl inside EditorToolbar. MediaContent renders validated media without EditorRoot. Supply a host upload callback when required. Validate boundary inputs with mediaSchema before calling parseMedia. Use HTTPS URLs without credentials. This item does not add generic document conversion or private asset delivery.",
  },
  files: [
    "media.ts",
    "media/controls.tsx",
    "media/extension.tsx",
    "media/html.ts",
    "media/model.ts",
    "media/schema.ts",
    "media/upload.ts",
    "media/view.tsx",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  name: "editor-media",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: [
    "editor",
    "aspect-ratio",
    "box",
    "button",
    "dialog",
    "field",
    "figcaption",
    "form",
    "input",
    "progress",
    "stack",
    "text",
    "toolbar",
    "wrap",
  ],
  title: "Editor media",
  type: "registry:ui",
}
