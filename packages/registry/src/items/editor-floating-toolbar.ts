import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorFloatingToolbarItem: SourceItem = {
  categories: ["input"],
  dependencies: [editorDependency("lexical")],
  description:
    "Compose a floating toolbar anchored to a native Lexical text range.",
  devDependencies: [],
  docs: {
    api: ["EditorFloatingToolbar", "EditorFloatingToolbarProps"],
    usage:
      "Place EditorFloatingToolbar inside EditorRoot beside EditorContent. Compose existing editor controls as children. Select text to open the toolbar. Press Alt+F10 to focus its first enabled button. Saved ranges expire after document changes or read-only transitions.",
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
  registryDependencies: ["editor", "popover", "toolbar"],
  title: "Editor floating toolbar",
  type: "registry:ui",
}
