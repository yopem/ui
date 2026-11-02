import type { SourceItem } from "@registry/items/types"

import { registryDependency } from "@registry/registry-dependencies"

export const editorToolbarMenusItem: SourceItem = {
  categories: ["input"],
  dependencies: [registryDependency("lucide-react")],
  description:
    "Compose native block insertion, conversion, text marks, and grouped editor controls.",
  devDependencies: [],
  docs: {
    api: [
      "EditorInsertMenu",
      "EditorTurnIntoMenu",
      "EditorMoreMenu",
      "EditorFixedToolbar",
      "EditorFixedToolbarButtons",
      "EditorListToolbarButtons",
      "EditorFloatingToolbarButtons",
      "EditorToolbarMenuProps",
      "EditorToolbarMenuAction",
      "EditorToolbarButtonsProps",
    ],
    usage:
      "Import toolbar parts from @/components/editor/toolbar-menus. Compose menus inside EditorRoot and EditorToolbar. Insert adds an empty block after one current root block. Turn Into converts native blocks. An explicit aria-label replaces the trigger text. More applies strikethrough, subscript, superscript, and highlight. Supply authorizeAction for additional synchronous menu-action checks. This callback does not authorize other grouped controls. Each configured policy must return literal true. Saved selections expire after document or editable-state changes. Reuse these parts for classic layouts. Compose EditorFloatingToolbarButtons inside the separately installed EditorFloatingToolbar. Optional feature nodes are not included.",
  },
  files: [
    {
      path: "components/editor/toolbar-menus.tsx",
      target: "@/components/editor/toolbar-menus.tsx",
      type: "registry:ui",
    },
  ],
  name: "editor-toolbar-menus",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: ["editor", "menu", "toolbar", "button"],
  title: "Editor toolbar menus",
  type: "registry:ui",
}
