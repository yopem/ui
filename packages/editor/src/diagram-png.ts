import { EDITOR_DIAGRAM_MAX_SVG_BYTES } from "./diagram-model"

const svgNamespace = "http://www.w3.org/2000/svg"

const xlinkNamespace = "http://www.w3.org/1999/xlink"

const maximumPngOutputBytes = 16_777_216

const maximumPngWidth = 4096

const maximumPngHeight = 16_384

const maximumPngPixels = 16_777_216

const maximumPngDurationMs = 30_000

function assertLocalSvgResources(document: Document) {
  for (const element of Array.from(document.getElementsByTagName("*"))) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()

      if (
        (name === "href" || attribute.namespaceURI === xlinkNamespace) &&
        !/^#[A-Za-z_][\w:.-]*$/u.test(attribute.value)
      )
        throw new Error("Diagram SVG contains external resources.")

      if (
        ["src", "srcset", "poster", "data"].includes(name) &&
        attribute.value.trim() !== ""
      )
        throw new Error("Diagram SVG contains external resources.")

      if (/url\s*\(|@import/iu.test(attribute.value))
        assertLocalSvgReferences(attribute.value)
    }

    if (element.localName === "style")
      assertLocalSvgReferences(element.textContent ?? "")
  }
}

function assertLocalSvgReferences(value: string) {
  const localReferences = value.replace(
    /url\(\s*(['"]?)#[A-Za-z_][\w:.-]*\1\s*\)/giu,
    "",
  )

  if (/@import|url\s*\(/iu.test(localReferences))
    throw new Error("Diagram SVG contains external resources.")
}

function parseSafeSvg(ownerDocument: Document, svg: string) {
  if (
    svg.length === 0 ||
    svg.length > EDITOR_DIAGRAM_MAX_SVG_BYTES ||
    new TextEncoder().encode(svg).byteLength > EDITOR_DIAGRAM_MAX_SVG_BYTES ||
    /<!DOCTYPE|<!ENTITY/iu.test(svg)
  )
    throw new Error("Diagram SVG is invalid or exceeds the size limit.")

  const view = ownerDocument.defaultView

  if (!view) throw new Error("Diagram PNG export is unavailable.")

  const document = new view.DOMParser().parseFromString(svg, "image/svg+xml")
  const root = document.documentElement

  if (
    root?.localName !== "svg" ||
    root.namespaceURI !== svgNamespace ||
    document.querySelector("parsererror")
  )
    throw new Error("Diagram SVG is invalid.")

  assertLocalSvgResources(document)

  return view
}

function assertPngDimensions(width: number, height: number) {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > maximumPngWidth ||
    height > maximumPngHeight ||
    width * height > maximumPngPixels
  )
    throw new Error("Diagram PNG dimensions exceed export limits.")
}

export function editorDiagramSvgToPng(
  ownerDocument: Document,
  svg: string,
  signal: AbortSignal,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Diagram PNG export was cancelled."))

      return
    }

    const deadlineAt = Date.now() + maximumPngDurationMs
    const view = parseSafeSvg(ownerDocument, svg)

    if (Date.now() >= deadlineAt) {
      reject(new Error("Diagram PNG export timed out."))

      return
    }

    let settled = false
    let objectUrl: string | undefined
    let image: HTMLImageElement | undefined
    let canvas: HTMLCanvasElement | undefined

    function cleanup() {
      signal.removeEventListener("abort", abort)
      view.clearTimeout(timer)

      if (image) {
        image.onload = null
        image.onerror = null
      }

      if (canvas) {
        canvas.width = 0
        canvas.height = 0
      }

      if (objectUrl !== undefined) view.URL.revokeObjectURL(objectUrl)
    }

    function fail(error: Error) {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }

    function abort() {
      fail(new Error("Diagram PNG export was cancelled."))
    }

    function finish(blob: Blob | null) {
      if (settled) return

      if (
        blob?.type.toLowerCase() !== "image/png" ||
        blob.size < 1 ||
        blob.size > maximumPngOutputBytes
      ) {
        fail(
          new Error("Diagram PNG output is invalid or exceeds the size limit."),
        )

        return
      }

      settled = true
      cleanup()
      resolve(blob)
    }

    const timer = view.setTimeout(() => {
      fail(new Error("Diagram PNG export timed out."))
    }, deadlineAt - Date.now())

    signal.addEventListener("abort", abort, { once: true })

    if (signal.aborted) {
      abort()

      return
    }

    try {
      objectUrl = view.URL.createObjectURL(
        new view.Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      )
      image = new view.Image()
      image.onerror = () => fail(new Error("Diagram SVG could not be decoded."))
      image.onload = () => {
        if (settled) return
        const currentImage = image

        if (currentImage === undefined) return

        if (Date.now() >= deadlineAt) {
          fail(new Error("Diagram PNG export timed out."))

          return
        }

        try {
          const width = currentImage.naturalWidth
          const height = currentImage.naturalHeight
          assertPngDimensions(width, height)
          canvas = ownerDocument.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const context = canvas.getContext("2d")

          if (!context) throw new Error("Diagram PNG canvas is unavailable.")
          context.drawImage(currentImage, 0, 0, width, height)
          canvas.toBlob((blob) => {
            if (Date.now() >= deadlineAt)
              fail(new Error("Diagram PNG export timed out."))
            else finish(blob)
          }, "image/png")
        } catch (error) {
          fail(
            error instanceof Error
              ? error
              : new Error("Diagram PNG export failed."),
          )
        }
      }

      image.src = objectUrl
    } catch (error) {
      fail(
        error instanceof Error
          ? error
          : new Error("Diagram PNG export failed."),
      )
    }
  })
}
