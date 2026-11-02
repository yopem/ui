export const editorDocumentExportParts = [
  {
    name: "EditorDocumentPDFExportControl",
    slug: "document-pdf-export-control",
    item: "editor-document-export-pdf",
    description:
      "Download one bounded raster PDF page with an explicit capture callback.",
  },
  {
    name: "EditorDocumentPrintControl",
    slug: "document-print-control",
    item: "editor-document-export",
    description:
      "Print a validated editor snapshot without an image capture SDK.",
  },
  {
    name: "EditorDocumentImageExportControl",
    slug: "document-image-export-control",
    item: "editor-document-export",
    description:
      "Download one bounded PNG with an explicit capture adapter and authorized resource resolver.",
  },
  {
    name: "EditorDocumentExportControls",
    slug: "document-export-controls",
    item: "editor-document-export",
    description:
      "Compose native print and bounded PNG export controls inside EditorRoot.",
  },
] as const
