import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorCopilotItem: SourceItem = {
  categories: ["input"],
  dependencies: [editorDependency("lexical"), editorDependency("zod")],
  description:
    "Review bounded inline AI completions at a native paragraph caret.",
  devDependencies: [],
  docs: {
    api: [
      "EditorCopilot",
      "EditorCopilotConfig",
      "EditorCopilotSnapshot",
      "createEditorCopilotSession",
      "firstEditorCopilotGrapheme",
    ],
    usage:
      "Render EditorCopilot inside EditorRoot with a stable explicit configuration. Supply a same-origin endpoint, document ID, and current authentication and CSRF headers. Request with Control+Space at a paragraph end. Clean completion is required before acceptance. Tab accepts all text. Mod+Right accepts one grapheme. Escape cancels. Host and user must both enable automatic requests. Provider billing can continue after cancellation. Configure host authorization, quota, and model selection separately.",
  },
  files: ["copilot.tsx", "copilot-session.ts", "ai-client.ts"].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui" as const,
  })),
  name: "editor-copilot",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: [
    "editor",
    "box",
    "button",
    "popover",
    "input",
    "checkbox",
    "label",
    "stack",
    "text",
  ],
  title: "Editor Copilot",
  type: "registry:ui",
}
