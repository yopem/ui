import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorCodeItem: SourceItem = {
  name: "editor-code",
  title: "Editor code",
  type: "registry:ui",
  categories: ["input"],
  description:
    "Adds native code editing, syntax colors, language selection, and code controls to EditorRoot.",
  dependencies: [
    editorDependency("@lexical/code-prism"),
    editorDependency("prismjs"),
  ],
  devDependencies: [],
  peerDependencies: [],
  registryDependencies: ["editor", "box", "native-select"],
  files: [
    "code.ts",
    "code-model.ts",
    "code-extension.ts",
    "code-controls.tsx",
    "code-editor.tsx",
    "code-languages.ts",
    "LICENSE.md",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: file === "LICENSE.md" ? "registry:lib" : "registry:ui",
  })),
  docs: {
    api: [
      "EditorCodeExtension",
      "EditorCode",
      "EditorCodeProps",
      "EditorCodeFormatButton",
      "EditorCodeFormatButtonProps",
      "EditorCodeFormatter",
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
      "Import code parts from @/components/editor/code. Add EditorCodeExtension to EditorRoot extensions. Use EditorCode for the toolbar preset, or compose controls inside EditorCodeToolbar. Keep EditorContent as the editable surface. Supply an explicit formatter for formatting controls. Install editor-code-format only for the optional Prettier adapter. Base code editing does not require Prettier.",
  },
}
