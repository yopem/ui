export const editorToolbarMenuParts = [
  {
    name: "EditorInsertMenu",
    slug: "insert-menu",
    item: "editor-toolbar-menus",
    description:
      "Insert a new native block after the current root block without changing its content.",
  },
  {
    name: "EditorTurnIntoMenu",
    slug: "turn-into-menu",
    item: "editor-toolbar-menus",
    description:
      "Convert selected native blocks and show the current block type.",
  },
  {
    name: "EditorMoreMenu",
    slug: "more-menu",
    item: "editor-toolbar-menus",
    description: "Apply less common native text marks with a saved selection.",
  },
  {
    name: "EditorFixedToolbar",
    slug: "fixed-toolbar",
    item: "editor-toolbar-menus",
    description: "Keep a grouped toolbar at the top of its scroll container.",
  },
  {
    name: "EditorFixedToolbarButtons",
    slug: "fixed-toolbar-buttons",
    item: "editor-toolbar-menus",
    description:
      "Compose history, blocks, marks, links, lists, and indentation from existing controls.",
  },
  {
    name: "EditorListToolbarButtons",
    slug: "list-toolbar-buttons",
    item: "editor-toolbar-menus",
    description: "Group native bullet, numbered, and checklist controls.",
  },
  {
    name: "EditorFloatingToolbarButtons",
    slug: "floating-toolbar-buttons",
    item: "editor-toolbar-menus",
    description:
      "Compose native marks, links, and More inside a floating toolbar.",
  },
  {
    name: "EditorReviewModeMenu",
    slug: "review-mode-menu",
    item: "editor-review",
    description:
      "Request Editing, Suggestion, or Viewing through an explicit host-controlled mode callback.",
  },
] as const
