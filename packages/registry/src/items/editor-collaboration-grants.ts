import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorCollaborationGrantsItem: SourceItem = {
  name: "editor-collaboration-grants",
  title: "Native collaboration grants",
  type: "registry:lib",
  categories: ["utility"],
  description:
    "Provides a bounded native collaboration grant handler and pure grant validation.",
  dependencies: [editorDependency("zod")],
  devDependencies: [],
  peerDependencies: [],
  registryDependencies: ["editor-auth", "editor-store"],
  files: [
    "collaboration-native-grants.ts",
    "collaboration-native-model.ts",
  ].map((file) => ({
    path: `lib/editor-collaboration/${file}`,
    target: `@/lib/editor-collaboration/${file}`,
    type: "registry:lib",
  })),
  docs: {
    api: [
      "createEditorNativeGrantsHttpHandler",
      "EditorNativeGrantsHttpOptions",
      "EditorNativeRoomGrantProvision",
      "EditorNativeRoomCredentialScope",
      "EditorNativePeerCredentialScope",
      "editorNativeRoomGrantSchema",
      "EditorNativeRoomGrant",
      "validateEditorNativeRoomGrant",
      "validateEditorNativeGrantEndpoint",
      "validateEditorNativeSocketUrl",
      "validateEditorNativeSignalingUrls",
    ],
    usage:
      "Import the handler from @/lib/editor-collaboration/collaboration-native-grants and codecs from @/lib/editor-collaboration/collaboration-native-model. Keep both on the server. Use existing authentication with verified expiry, CSRF approval, and literal true from the document policy. Provision the authoritative room. Verify each Hocuspocus credential against current host state. See /docs/editor-collaboration.",
  },
}
