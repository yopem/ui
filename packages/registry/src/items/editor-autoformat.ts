import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorAutoformatItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("@lexical/extension"),
    editorDependency("@lexical/markdown"),
    editorDependency("@lexical/rich-text"),
    editorDependency("lexical"),
  ],
  description:
    "Add native checklist, nested quote, rule, and smart text input shortcuts.",
  devDependencies: [],
  docs: {
    api: [
      "EditorAutoformatExtension",
      "EditorAutoformatConfig",
      "EditorAutoformatTransformer",
    ],
    usage:
      "Register EditorAutoformatExtension in a stable root extensions array. Configure host element and text-match transformers with Lexical configExtension. Host rules precede the extension's built-ins. Set includeBuiltInRules to false to omit only these built-ins. Keep trusted synchronous callbacks and transformer arrays stable until remount. Base Markdown stays separate. Code keeps literal text. Fractions require a word boundary. Guillemet shortcuts require preceding text or whitespace. Native history, IME, clipboard, and overlapping pattern behavior need host validation.",
  },
  files: [
    {
      path: "components/editor/autoformat.ts",
      target: "@/components/editor/autoformat.ts",
      type: "registry:ui",
    },
  ],
  name: "editor-autoformat",
  peerDependencies: [],
  registryDependencies: ["editor"],
  title: "Editor input shortcuts",
  type: "registry:ui",
}
