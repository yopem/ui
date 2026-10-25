import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorCollaborationNativeItem: SourceItem = {
  name: "editor-collaboration-native",
  title: "Native editor collaboration providers",
  type: "registry:lib",
  categories: ["input"],
  description:
    "Connects Lexical to host-authorized Hocuspocus and trusted-writer WebRTC rooms.",
  dependencies: [
    editorDependency("@hocuspocus/provider"),
    editorDependency("@lexical/yjs"),
    editorDependency("y-webrtc"),
    editorDependency("yjs"),
    editorDependency("y-protocols"),
    editorDependency("zod"),
  ],
  devDependencies: [],
  peerDependencies: [],
  registryDependencies: ["editor-collaboration"],
  files: ["collaboration-native.ts", "collaboration-native-model.ts"].map(
    (file) => ({
      path: `components/editor/${file}`,
      target: `@/components/editor/${file}`,
      type: "registry:lib",
    }),
  ),
  docs: {
    api: [
      "createEditorNativeCollaboration",
      "EditorNativeCollaborationProvider",
      "EditorNativeCollaborationOptions",
      "EditorNativeCollaborationSnapshot",
      "EditorNativeWebrtcStatus",
      "EditorNativeRoomGrant",
      "editorNativeRoomGrantSchema",
      "validateEditorNativeRoomGrant",
      "validateEditorNativeGrantEndpoint",
      "validateEditorNativeSocketUrl",
      "validateEditorNativeSignalingUrls",
    ],
    usage:
      "Import the native provider from @/components/editor/collaboration-native. Import grant codecs from @/components/editor/collaboration-native-model. Keep one provider and controller per root. Require an expiring host grant and authoritative room initialization. Configure trusted WSS signaling for writer-only WebRTC. Hocuspocus sync does not confirm durable storage. See /docs/editor-collaboration.",
  },
}
