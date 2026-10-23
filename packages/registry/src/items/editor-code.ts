import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorCodeItem: SourceItem = {
  name: "editor-code",
  title: "Editor code",
  type: "registry:ui",
  categories: ["input"],
  description:
    "Adds native code editing, syntax colors, language selection, and code controls to EditorRoot.",
  dependencies: [editorDependency("@lexical/code-prism")],
  devDependencies: [],
  peerDependencies: [],
  registryDependencies: ["editor", "native-select"],
  files: [
    "code.ts",
    "code-model.ts",
    "code-extension.ts",
    "code-controls.tsx",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  docs: {
    api: [
      "EditorCodeExtension",
      "EditorCodeToolbar",
      "EditorCodeToolbarProps",
      "EditorCodeLanguage",
      "EditorCodeLanguageProps",
      "EditorCodeCopyButton",
      "EditorCodeCopyButtonProps",
      "EditorCodeToggle",
      "EditorCodeToggleProps",
      "EditorCodeStatus",
      "EditorCodeStatusProps",
    ],
    usage:
      "Import code parts from @/components/editor/code. Add EditorCodeExtension to EditorRoot extensions. Put code controls inside EditorCodeToolbar. Keep EditorContent as the editable surface.",
  },
}
