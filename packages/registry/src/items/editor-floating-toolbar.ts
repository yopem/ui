import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorFloatingToolbarItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("lexical"),
    editorDependency("@lexical/link"),
  ],
  description:
    "Compose a floating toolbar anchored to a native Lexical text range.",
  devDependencies: [],
  docs: {
    api: [
      "EditorFloatingToolbar",
      "EditorFloatingToolbarProps",
      "EditorLinkFloatingToolbar",
      "EditorLinkFloatingToolbarProps",
    ],
    usage:
      "Place EditorFloatingToolbar inside EditorRoot beside EditorContent. Compose existing editor controls as children. Select text to open the toolbar. Use EditorLinkFloatingToolbar for open, edit, and remove actions at a link caret. Press Alt+F10 to focus the first enabled control. Saved ranges expire after document changes or read-only transitions.",
  },
  files: [
    {
      path: "components/editor/floating-toolbar.tsx",
      target: "@/components/editor/floating-toolbar.tsx",
      type: "registry:ui",
    },
  ],
  name: "editor-floating-toolbar",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: ["editor", "popover", "toolbar", "button"],
  title: "Editor floating toolbar",
  type: "registry:ui",
}
