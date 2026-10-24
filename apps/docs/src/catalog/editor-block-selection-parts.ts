export const editorBlockSelectionParts = [
  {
    name: "EditorBlockSelection",
    slug: "block-selection",
    item: "editor-block-selection",
    description: "Provide block selection state to child controls.",
  },
  {
    name: "EditorBlockSelectionGutter",
    slug: "block-selection-gutter",
    item: "editor-block-selection",
    description: "Select top-level blocks by pointer or keyboard.",
  },
  {
    name: "EditorBlockDragHandle",
    slug: "block-drag-handle",
    item: "editor-block-selection",
    description: "Move a selected block by pointer.",
  },
  {
    name: "EditorBlockSelectionActions",
    slug: "block-selection-actions",
    item: "editor-block-selection",
    description: "Group block actions and selection controls.",
  },
  {
    name: "EditorBlockSelectionAction",
    slug: "block-selection-action",
    item: "editor-block-selection",
    description: "Run one whole-block action.",
  },
  {
    name: "EditorBlockSelectionStatus",
    slug: "block-selection-status",
    item: "editor-block-selection",
    description: "Announce selection, drag, and error states.",
  },
] as const
