import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorAiItem: SourceItem = {
  categories: ["utility"],
  dependencies: [editorDependency("zod")],
  description:
    "Streams authenticated text proposals through host-configured AI providers.",
  devDependencies: [],
  docs: {
    api: [
      "createEditorAiHandler",
      "createOpenAiProvider",
      "createAnthropicProvider",
      "createWorkersAiProvider",
      "AiInput",
      "AiEvent",
      "EditorAiProvider",
      "AiProviderOptions",
      "AiHandlerOptions",
    ],
    usage:
      "Import server helpers from @/lib/editor-ai. Supply existing authentication, document policy, exact HTTPS origin, CSRF verification, durable quota, and provider configuration. See /docs/editor-ai.",
  },
  files: [
    "index.ts",
    "contracts.ts",
    "http.ts",
    "providers.ts",
    "streams.ts",
  ].map((file) => ({
    path: `lib/editor-ai/${file}`,
    target: `@/lib/editor-ai/${file}`,
    type: "registry:lib",
  })),
  name: "editor-ai",
  peerDependencies: [],
  registryDependencies: ["editor-auth"],
  title: "Editor AI server",
  type: "registry:lib",
}
