"use client"

import type { EditorDocumentImageExportControlProps } from "./document-export"
import type { EditorDocumentExportOperation } from "./document-export-model"

import { useEditorDocumentRasterExport } from "./document-export"
import {
  assertEditorDocumentExportActive,
  EditorDocumentExportError,
  editorDocumentExportLimits,
  validateEditorDocumentExportDimensions,
  waitForEditorDocumentExport,
} from "./document-export-model"

function rasterPDF(jpeg: Blob, width: number, height: number) {
  const unit = height > 14_400 ? 2 : 1
  const pageWidth = width / unit
  const pageHeight = height / unit
  const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`
  const parts: Blob[] = []
  const offsets = [0]
  let length = 0

  function append(part: string | Blob) {
    const blob = new Blob([part])
    parts.push(blob)
    length += blob.size
  }

  function object(body: string | Blob) {
    offsets.push(length)
    append(`${offsets.length - 1} 0 obj\n`)
    append(body)
    append("\nendobj\n")
  }

  append("%PDF-1.7\n%\u00e2\u00e3\u00cf\u00d3\n")
  object("<< /Type /Catalog /Pages 2 0 R >>")
  object("<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
  object(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /UserUnit ${unit} /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  )
  object(
    new Blob([
      `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.size} >>\nstream\n`,
      jpeg,
      "\nendstream",
    ]),
  )
  object(
    `<< /Length ${new TextEncoder().encode(content).byteLength} >>\nstream\n${content}endstream`,
  )
  const xref = length
  append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`)

  for (const offset of offsets.slice(1))
    append(`${String(offset).padStart(10, "0")} 00000 n \n`)
  append(
    `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`,
  )
  const pdf = new Blob(parts, { type: "application/pdf" })

  if (pdf.size > editorDocumentExportLimits.maxOutputBytes)
    throw new EditorDocumentExportError(
      "resource-limit",
      "PDF export exceeds the output limit.",
    )

  return pdf
}

async function encodePDF(
  png: Blob,
  ownerDocument: Document,
  operation: EditorDocumentExportOperation,
  dimensions: { readonly width: number; readonly height: number },
) {
  assertEditorDocumentExportActive(operation)
  validateEditorDocumentExportDimensions(dimensions.width, dimensions.height)
  const view = ownerDocument.defaultView

  if (!view)
    throw new EditorDocumentExportError(
      "document",
      "PDF export needs a mounted editor view.",
    )
  const image = new view.Image()
  const canvas = ownerDocument.createElement("canvas")
  const url = view.URL.createObjectURL(png)

  try {
    image.src = url
    await waitForEditorDocumentExport(image.decode(), operation)
    assertEditorDocumentExportActive(operation)
    const { naturalWidth: width, naturalHeight: height } = image
    validateEditorDocumentExportDimensions(width, height)

    if (width !== dimensions.width || height !== dimensions.height)
      throw new EditorDocumentExportError(
        "dimensions",
        "PDF image dimensions do not match the snapshot.",
      )
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d", { alpha: false })

    if (!context)
      throw new EditorDocumentExportError(
        "document",
        "PDF export needs browser canvas support.",
      )
    context.fillStyle = "white"
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0)
    assertEditorDocumentExportActive(operation)

    const jpeg = await waitForEditorDocumentExport(
      new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.95),
      ),
      operation,
    )

    assertEditorDocumentExportActive(operation)

    if (
      jpeg?.type !== "image/jpeg" ||
      jpeg.size < 1 ||
      jpeg.size > editorDocumentExportLimits.maxOutputBytes
    )
      throw new EditorDocumentExportError(
        "resource-limit",
        "PDF export did not produce a bounded JPEG image.",
      )
    const pdf = rasterPDF(jpeg, width, height)
    assertEditorDocumentExportActive(operation)

    return pdf
  } finally {
    image.removeAttribute("src")
    view.URL.revokeObjectURL(url)
    canvas.width = 0
    canvas.height = 0
  }
}

export type EditorDocumentPDFExportControlProps =
  EditorDocumentImageExportControlProps

export function EditorDocumentPDFExportControl(
  props: EditorDocumentPDFExportControlProps,
) {
  return useEditorDocumentRasterExport({
    ...props,
    format: "PDF",
    encode: encodePDF,
  })
}
