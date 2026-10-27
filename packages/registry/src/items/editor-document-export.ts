import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorDocumentExportItem: SourceItem = {
  name: "editor-document-export",
  title: "Editor document export",
  type: "registry:ui",
  categories: ["input"],
  description:
    "Print validated editor documents or export bounded PNG images with an explicit capture adapter.",
  dependencies: [
    editorDependency("lexical"),
    editorDependency("@base-ui/react"),
    editorDependency("zod"),
    editorDependency("@types/hast"),
    editorDependency("hast-util-from-html"),
    editorDependency("hast-util-to-html"),
  ],
  devDependencies: [],
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: [
    "editor",
    "editor-document",
    "box",
    "button",
    "text",
    "wrap",
  ],
  files: [
    "serial-iteration.ts",
    "checksum.ts",
    "document-export.tsx",
    "document-export-model.ts",
    "document-export-image.ts",
  ].map((name) => ({
    path: `components/editor/${name}`,
    target: `@/components/editor/${name}`,
    type: "registry:ui" as const,
  })),
  docs: {
    api: [
      "EditorDocumentPrintControl",
      "EditorDocumentPrintControlProps",
      "EditorDocumentImageExportControl",
      "EditorDocumentImageExportControlProps",
      "EditorDocumentExportControls",
      "EditorDocumentExportControlsProps",
      "EditorDocumentImageCapture",
      "EditorDocumentExportResourceResolver",
      "EditorDocumentExportOperation",
      "editorDocumentExportLimits",
    ],
    usage:
      "Compose export controls inside EditorRoot. Print needs no image SDK. PNG requires an explicit capture callback or the optional editor-document-export-image adapter. Read-only roots can export. Remote images require an abort-aware host resolver with exact origin and private asset policy. Use a CSP nonce when required. Export validates a canonical snapshot and does not change selection or history. Print and PNG layouts allow 4096 by 16384 pixels and 16777216 pixels total. Resource admission counts cached image occurrences and their repeated bytes. PNG validation checks chunk structure and checksums, not decoded pixels. Synchronous browser work and native print dialogs cannot be cancelled. Browser, font, CSP, and resource behavior need deferred verification.",
  },
}

export const editorDocumentExportImageItem: SourceItem = {
  name: "editor-document-export-image",
  title: "Editor document image adapter",
  type: "registry:lib",
  categories: ["input"],
  description:
    "Capture bounded validated document snapshots with the optional html-to-image adapter.",
  dependencies: [editorDependency("html-to-image")],
  devDependencies: [],
  peerDependencies: [],
  registryDependencies: ["editor-document-export"],
  files: ["document-export-html-to-image.ts", "LICENSE.md"].map((name) => ({
    path: `components/editor/${name}`,
    target: `@/components/editor/${name}`,
    type: "registry:lib" as const,
  })),
  docs: {
    api: ["captureEditorDocumentImageWithHtmlToImage"],
    usage:
      "Import captureEditorDocumentImageWithHtmlToImage from the separate document-export-html-to-image module. Pass it as capture to the PNG control. The adapter validates SVG before rasterizing in the editor owner document. It skips web fonts and uses local font fallbacks. SVG foreignObject support and CSP require browser verification. Cancellation discards output but cannot stop synchronous SVG or canvas work. No capture SDK is copied by the base print item.",
  },
}
