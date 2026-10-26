import { toSvg } from "html-to-image"

import type { EditorDocumentImageCapture } from "./document-export-image"

import { validateEditorDocumentExportSVG } from "./document-export-image"
import {
  assertEditorDocumentExportActive,
  EditorDocumentExportError,
  validateEditorDocumentExportDimensions,
  waitForEditorDocumentExport,
} from "./document-export-model"

export const captureEditorDocumentImageWithHtmlToImage: EditorDocumentImageCapture =
  async function captureEditorDocumentImageWithHtmlToImage(target, options) {
    assertEditorDocumentExportActive(options)

    const dimensions = validateEditorDocumentExportDimensions(
      options.width,
      options.height,
    )

    const ownerDocument = target.ownerDocument
    const view = ownerDocument.defaultView

    if (!view)
      throw new EditorDocumentExportError(
        "document",
        "PNG export needs a mounted browser document.",
      )

    let svgDataURL: string

    try {
      assertEditorDocumentExportActive(options)

      const svgWork = toSvg(target, {
        height: dimensions.height,
        pixelRatio: 1,
        skipFonts: true,
        width: dimensions.width,
      })

      svgDataURL = await waitForEditorDocumentExport(svgWork, options)
    } catch (error) {
      if (error instanceof EditorDocumentExportError) throw error
      throw new EditorDocumentExportError(
        "svg",
        "Could not render the document for PNG export.",
      )
    }

    assertEditorDocumentExportActive(options)
    const parser = new view.DOMParser()

    const svg = validateEditorDocumentExportSVG(
      svgDataURL,
      (source) => {
        const parsed = parser.parseFromString(source, "image/svg+xml")

        return {
          root: parsed.documentElement,
          createTreeWalker(whatToShow: number) {
            return parsed.createTreeWalker(parsed.documentElement, whatToShow)
          },
          querySelector(selector: string) {
            return parsed.querySelector(selector)
          },
          querySelectorAll(selector: string) {
            return parsed.querySelectorAll(selector)
          },
        }
      },
      options,
      dimensions,
    )

    const encodedSvg = encodeURIComponent(svg)
    assertEditorDocumentExportActive(options)
    const image = ownerDocument.createElement("img")
    image.decoding = "async"
    const canvas = ownerDocument.createElement("canvas")

    try {
      assertEditorDocumentExportActive(options)
      image.src = `data:image/svg+xml;charset=utf-8,${encodedSvg}`
      assertEditorDocumentExportActive(options)
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      assertEditorDocumentExportActive(options)
      await waitForEditorDocumentExport(image.decode(), options)
      assertEditorDocumentExportActive(options)

      const context = canvas.getContext("2d")
      assertEditorDocumentExportActive(options)

      if (!context)
        throw new EditorDocumentExportError(
          "png",
          "This browser cannot render document PNG images.",
        )

      context.drawImage(image, 0, 0, dimensions.width, dimensions.height)
      assertEditorDocumentExportActive(options)

      const blobWork = new Promise<Blob | null>((resolve) => {
        assertEditorDocumentExportActive(options)
        canvas.toBlob(resolve, "image/png")
      })

      const blob = await waitForEditorDocumentExport(blobWork, options)

      if (!blob)
        throw new EditorDocumentExportError(
          "png",
          "This browser could not encode the document PNG.",
        )

      return blob
    } finally {
      image.removeAttribute("src")
      canvas.width = 0
      canvas.height = 0
    }
  }
