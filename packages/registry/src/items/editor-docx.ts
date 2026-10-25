import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorDocxItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("lexical"),
    editorDependency("zod"),
    editorDependency("@types/hast"),
    editorDependency("@base-ui/react"),
  ],
  description:
    "Import and export a bounded semantic subset of native Word documents.",
  devDependencies: [],
  docs: {
    api: [
      "EditorDocxImportControl",
      "EditorDocxImportControlProps",
      "EditorDocxExportControl",
      "EditorDocxExportControlProps",
      "EditorDocxControls",
      "EditorDocxControlsProps",
      "parseDocx",
      "importDocx",
      "exportDocx",
      "DocxSource",
      "DocxImportOptions",
      "docxLimits",
    ],
    usage:
      "Install editor-docx separately. Import portable functions from docx and client controls from docx-controls. Compose focused controls inside EditorRoot. Read-only roots can export but cannot import. Imports validate archive, XML, semantic content, and target registration before replacement. Use cancellation signals for host lifecycle changes. Files have independent 1 MiB archive and decoded-data limits. Unsupported content rejects. Page layout, images, macros, headers, and footers are not preserved. Native decompression support is required for deflated archives. Runtime and Word fidelity checks remain pending.",
  },
  files: [
    "docx.ts",
    "docx-controls.tsx",
    "docx-export.ts",
    "docx-import.ts",
    "docx-limits.ts",
    "docx-security.ts",
    "docx-xml.ts",
    "docx-zip.ts",
  ].map((name) => ({
    path: `components/editor/${name}`,
    target: `@/components/editor/${name}`,
    type: "registry:ui" as const,
  })),
  name: "editor-docx",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: [
    "editor-document",
    "box",
    "button",
    "field",
    "input",
    "text",
    "wrap",
  ],
  title: "Editor DOCX",
  type: "registry:ui",
}
