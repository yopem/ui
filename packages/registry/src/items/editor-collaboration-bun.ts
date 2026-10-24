import type { SourceItem } from "@registry/items/types"

import { resolveDependency } from "@registry/registry-dependencies"
import workspace from "@workspace/package.json"

export const editorCollaborationBunItem: SourceItem = {
  name: "editor-collaboration-bun",
  title: "Editor collaboration Bun adapter",
  type: "registry:lib",
  categories: ["utility"],
  description:
    "Adds bounded native Bun HTTP and WebSocket collaboration handlers.",
  dependencies: [],
  devDependencies: [
    resolveDependency("@types/bun", workspace.devDependencies["@types/bun"]),
  ],
  peerDependencies: [],
  registryDependencies: ["editor-collaboration-server"],
  files: [
    {
      path: "lib/editor-collaboration/collaboration-bun.ts",
      target: "@/lib/editor-collaboration/collaboration-bun.ts",
      type: "registry:lib",
    },
  ],
  docs: {
    api: ["createBunEditorCollaborationService"],
    usage:
      "Import createBunEditorCollaborationService from @/lib/editor-collaboration/collaboration-bun. Supply existing authenticated HTTP options and an exact HTTPS origin. Pass the returned fetch and websocket handlers unchanged to Bun.serve with host TLS and connection limits. Keep Bun types and this entry separate from Node and Worker bundles. Native runtime checks remain deferred.",
  },
}
