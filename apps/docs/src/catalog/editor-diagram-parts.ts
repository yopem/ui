export const editorDiagramParts = [
  {
    name: "EditorDiagramRoot",
    slug: "diagram-root",
    item: "editor-diagram",
    description:
      "Provide one diagram controller and explicit renderer configuration.",
  },
  {
    name: "EditorDiagramToolbar",
    slug: "diagram-toolbar",
    item: "editor-diagram",
    description: "Compose focused native diagram controls.",
  },
  {
    name: "EditorDiagramInsertButton",
    slug: "diagram-insert-button",
    item: "editor-diagram",
    description: "Insert a native code diagram.",
  },
  {
    name: "EditorDiagramKindSelect",
    slug: "diagram-kind-select",
    item: "editor-diagram",
    description: "Set the selected diagram language.",
  },
  {
    name: "EditorDiagramViewModeSelect",
    slug: "diagram-view-mode-select",
    item: "editor-diagram",
    description: "Choose source, image, or combined output.",
  },
  {
    name: "EditorDiagramRenderButton",
    slug: "diagram-render-button",
    item: "editor-diagram",
    description: "Render the current source with a configured renderer.",
  },
  {
    name: "EditorDiagramDownloadButton",
    slug: "diagram-download-button",
    item: "editor-diagram",
    description: "Download the current sanitized SVG.",
  },
  {
    name: "EditorDiagramDeleteButton",
    slug: "diagram-delete-button",
    item: "editor-diagram",
    description: "Delete the selected native diagram code block.",
  },
  {
    name: "EditorDiagramStatus",
    slug: "diagram-status",
    item: "editor-diagram",
    description: "Read renderer progress and errors.",
  },
  {
    name: "EditorDiagramPreview",
    slug: "diagram-preview",
    item: "editor-diagram",
    description:
      "Inspect the current rendered SVG without replacing native content.",
  },
] as const
