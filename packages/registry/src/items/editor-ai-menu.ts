import type { SourceItem } from "@registry/items/types"

import { registryDependency } from "@registry/registry-dependencies"

export const editorAiMenuItem: SourceItem = {
  name: "editor-ai-menu",
  title: "Editor AI menu",
  type: "registry:ui",
  categories: ["input"],
  description:
    "Adds configured AI commands, bounded chat, and explicit proposal decisions to EditorRoot.",
  dependencies: [],
  devDependencies: [],
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: ["editor", "editor-review", "list"],
  files: [
    {
      path: "components/editor/ai-menu.tsx",
      type: "registry:ui",
      target: "@/components/editor/ai-menu.tsx",
    },
  ],
  docs: {
    api: [
      "EditorAiMenuRoot",
      "EditorAiMenuTrigger",
      "EditorAiMenuContent",
      "EditorAiMenuPanel",
    ],
    usage:
      "Compose these parts inside configured EditorAiRoot and EditorRoot. EditorAiMenuContent owns the editable surface. Supply an explicit host endpoint, document ID, and current authentication and CSRF headers. Approve completed plain text explicitly. Bounded chat stays in memory until the menu root unmounts. Review comments require the current review policy.",
  },
}
