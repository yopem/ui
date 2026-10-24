import type { SourceItem } from "@registry/items/types"

import { resolveDependency } from "@registry/registry-dependencies"
import workspace from "@workspace/package.json"

export const editorCollaborationWorkerItem: SourceItem = {
  name: "editor-collaboration-worker",
  title: "Editor collaboration Worker",
  type: "registry:lib",
  categories: ["utility"],
  description:
    "Adds the explicit Durable Objects adapter and D1 bootstrap migration.",
  dependencies: [],
  devDependencies: [
    resolveDependency(
      "@cloudflare/workers-types",
      workspace.devDependencies["@cloudflare/workers-types"],
    ),
  ],
  peerDependencies: [],
  registryDependencies: ["editor-collaboration-server"],
  files: ["collaboration-do.ts", "collaboration/0003-do-canonical.sql"].map(
    (file) => ({
      path: `lib/editor-collaboration/${file}`,
      target: `@/lib/editor-collaboration/${file}`,
      type: "registry:lib",
    }),
  ),
  docs: {
    api: ["EditorCollaborationRoom", "EditorCollaborationRoomOptions"],
    usage:
      "Import EditorCollaborationRoom from @/lib/editor-collaboration/collaboration-do only in Workers. Configure Worker types in the Worker compiler target. Supply existing authentication, verified expiry, exact origins, host CSRF and document policy. Apply the D1 snapshot and canonical bootstrap migrations. Forward native Durable Objects lifecycle callbacks. See /docs/editor-collaboration.",
  },
}
