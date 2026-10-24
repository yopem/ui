import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { resolveDependency } from "@registry/registry-dependencies"
import workspace from "@workspace/package.json"

export const editorCollaborationNodeItem: SourceItem = {
  name: "editor-collaboration-node",
  title: "Editor collaboration Node adapter",
  type: "registry:lib",
  categories: ["utility"],
  description:
    "Adds a bounded native Node HTTP and WebSocket collaboration adapter.",
  dependencies: [editorDependency("ws")],
  devDependencies: [
    resolveDependency("@types/ws", workspace.devDependencies["@types/ws"]),
    resolveDependency("@types/node", workspace.devDependencies["@types/node"]),
  ],
  peerDependencies: [],
  registryDependencies: ["editor-collaboration-server"],
  files: [
    {
      path: "lib/editor-collaboration/collaboration-node.ts",
      target: "@/lib/editor-collaboration/collaboration-node.ts",
      type: "registry:lib",
    },
  ],
  docs: {
    api: ["createNodeEditorCollaborationService"],
    usage:
      "Import createNodeEditorCollaborationService from @/lib/editor-collaboration/collaboration-node. Supply existing authenticated HTTP options and an exact HTTPS public origin. Bind the HTTP listener privately behind a trusted HTTPS and WSS proxy. Keep this Node entry out of browser and Worker bundles. Native runtime checks remain deferred.",
  },
}
