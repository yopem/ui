import type { SourceItem } from "@registry/items/types"

export const editorDocumentExportPDFItem: SourceItem = {
  name: "editor-document-export-pdf",
  title: "Editor document PDF export",
  type: "registry:ui",
  categories: ["input"],
  description:
    "Download one bounded raster PDF page with an explicit PNG capture callback.",
  dependencies: [],
  devDependencies: [],
  peerDependencies: [],
  registryDependencies: ["editor-document-export"],
  files: [
    {
      path: "components/editor/document-export-pdf.tsx",
      target: "@/components/editor/document-export-pdf.tsx",
      type: "registry:ui",
    },
  ],
  docs: {
    api: [
      "EditorDocumentPDFExportControl",
      "EditorDocumentPDFExportControlProps",
    ],
    usage:
      "Compose EditorDocumentPDFExportControl inside EditorRoot. Supply an explicit PNG capture callback. Install editor-document-export-image only when you need its optional capture adapter. The control downloads plate.pdf without a print dialog. Each PDF contains one raster page, not selectable text. Native browser decoding checks the validated PNG before JPEG encoding on opaque white paper. Actual image dimensions must match the snapshot and stay within 4096 by 16384 pixels and 16777216 pixels total. Output has a 16 MiB limit. Read-only roots can export without changes to content, selection, or history. Resource policy, CSP nonce, cancellation, stale-document checks, and the shared operation lease match PNG export. Cancellation retains capacity until outstanding native work settles. No network service or PDF SDK is included. Browser and real PDF output acceptance remain deferred.",
  },
}
