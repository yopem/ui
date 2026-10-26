import type { Element, Root } from "hast"

import { fromHtml } from "hast-util-from-html"
import { toHtml } from "hast-util-to-html"
import { z } from "zod"

import type { EditorDocumentExportOperation } from "./document-export-model"

import {
  assertEditorDocumentExportActive,
  EditorDocumentExportError,
  editorDocumentExportLimits,
  parseEditorDocumentExportFailure,
  validateEditorDocumentExportDataURL,
  validateEditorDocumentExportDimensions,
  validateEditorDocumentExportURL,
  waitForEditorDocumentExport,
} from "./document-export-model"

export interface EditorDocumentExportResourceRequest extends EditorDocumentExportOperation {
  readonly url: URL
}

export type EditorDocumentExportResourceResolver = (
  url: URL,
  operation: EditorDocumentExportOperation,
) => Promise<Response>

export interface EditorDocumentImageCaptureOptions extends EditorDocumentExportOperation {
  readonly width: number
  readonly height: number
}

export type EditorDocumentImageCapture = (
  target: HTMLElement,
  options: EditorDocumentImageCaptureOptions,
) => Promise<Blob>

export interface EditorDocumentExportSnapshot {
  readonly root: HTMLDivElement
  readonly styles: HTMLStyleElement
  readonly width: number
  readonly height: number
  dispose(): void
}

interface SnapshotOptions extends EditorDocumentExportOperation {
  readonly nonce?: string
  readonly purpose: "image" | "print"
  readonly resolveResource?: EditorDocumentExportResourceResolver
}

interface ResourceBudget {
  count: number
  bytes: number
  readonly cache: Map<string, Promise<string>>
}

const allowedImageTypes = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
])

const unsupportedTags = new Set([
  "applet",
  "audio",
  "base",
  "canvas",
  "embed",
  "fencedframe",
  "form",
  "frame",
  "frameset",
  "iframe",
  "link",
  "noembed",
  "noframes",
  "noscript",
  "object",
  "parsererror",
  "plaintext",
  "portal",
  "script",
  "source",
  "style",
  "svg",
  "template",
  "track",
  "video",
  "xmp",
])

const unsupportedResourceAttributes = new Set([
  "action",
  "archive",
  "attributionsrc",
  "background",
  "codebase",
  "data",
  "formaction",
  "icon",
  "longdesc",
  "manifest",
  "ping",
  "poster",
  "profile",
  "srcdoc",
  "srcset",
  "usemap",
  "xlink:href",
  "xlinkhref",
  "xml:base",
  "xmlbase",
])

const svgURLAttributes = new Set([
  "clip-path",
  "color-profile",
  "cursor",
  "fill",
  "filter",
  "marker",
  "marker-end",
  "marker-mid",
  "marker-start",
  "mask",
  "stroke",
  "style",
])

const maxHTMLDepth = 128

const exportStringSchema = z.string()

function exportString(value: Element["properties"][string]) {
  const parsed = exportStringSchema.safeParse(value)

  return parsed.success ? parsed.data : undefined
}

let snapshotId = 0

function encodeBase64(bytes: Uint8Array) {
  let binary = ""

  for (let offset = 0; offset < bytes.length; offset += 32_768) {
    const chunk = bytes.subarray(offset, offset + 32_768)
    let part = ""

    for (const byte of chunk) part += String.fromCharCode(byte)
    binary += part
  }

  return btoa(binary)
}

function cancelExportResponseBody(
  response: Response,
  operation: EditorDocumentExportOperation,
) {
  if (!response.body) return Promise.resolve()

  try {
    const cancellation = response.body.cancel().catch(() => undefined)
    void waitForEditorDocumentExport(cancellation, operation).catch(
      () => undefined,
    )

    return cancellation
  } catch {
    return Promise.resolve()
  }
}

function cancelExportReader(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  operation: EditorDocumentExportOperation,
) {
  let cancellation: Promise<void> | undefined

  try {
    cancellation = reader.cancel()
  } catch {
    cancellation = undefined
  }

  if (cancellation)
    void waitForEditorDocumentExport(cancellation, operation).catch(
      () => undefined,
    )

  try {
    reader.releaseLock()
  } catch {
    return
  }
}

export async function readEditorDocumentExportResource(
  response: Response,
  request: EditorDocumentExportResourceRequest,
  totalBytes: number,
) {
  assertEditorDocumentExportActive(request)

  if (
    !response.ok ||
    response.redirected ||
    (response.url !== "" && response.url !== request.url.href)
  ) {
    void cancelExportResponseBody(response, request)
    throw new EditorDocumentExportError(
      "resource",
      "A document image could not be loaded.",
    )
  }

  const mediaType =
    response.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() ?? ""

  const declaredLength = response.headers.get("content-length")
  const length = declaredLength === null ? null : Number(declaredLength)

  if (
    !allowedImageTypes.has(mediaType) ||
    (length !== null && (!Number.isSafeInteger(length) || length < 1)) ||
    (length !== null && length > editorDocumentExportLimits.maxResourceBytes) ||
    (length !== null &&
      totalBytes + length > editorDocumentExportLimits.maxTotalResourceBytes) ||
    totalBytes > editorDocumentExportLimits.maxTotalResourceBytes
  ) {
    void cancelExportResponseBody(response, request)
    throw new EditorDocumentExportError(
      "resource-limit",
      "A document image exceeds the export limits.",
    )
  }

  const reader = response.body?.getReader()

  if (!reader)
    throw new EditorDocumentExportError(
      "resource",
      "A document image has no readable data.",
    )

  let bytes: Uint8Array
  let byteLength = 0
  let completed = false

  try {
    bytes = new Uint8Array(editorDocumentExportLimits.maxResourceBytes)

    while (true) {
      assertEditorDocumentExportActive(request)
      const result = await waitForEditorDocumentExport(reader.read(), request)
      assertEditorDocumentExportActive(request)

      if (result.done) {
        completed = true
        break
      }

      const chunk = result.value

      if (
        byteLength + chunk.byteLength >
          editorDocumentExportLimits.maxResourceBytes ||
        totalBytes + byteLength + chunk.byteLength >
          editorDocumentExportLimits.maxTotalResourceBytes
      )
        throw new EditorDocumentExportError(
          "resource-limit",
          "A document image exceeds the export limits.",
        )

      bytes.set(chunk, byteLength)
      byteLength += chunk.byteLength
    }
  } catch (error) {
    cancelExportReader(reader, request)
    throw error
  } finally {
    if (completed) reader.releaseLock()
  }

  assertEditorDocumentExportActive(request)

  if (byteLength < 1)
    throw new EditorDocumentExportError(
      "resource",
      "A document image has invalid data.",
    )

  const dataURL = `data:${mediaType};base64,${encodeBase64(bytes.subarray(0, byteLength))}`
  assertEditorDocumentExportActive(request)

  return { dataURL, mediaType, byteLength }
}

function resolveImage(
  value: string,
  documentURL: string,
  options: SnapshotOptions,
  budget: ResourceBudget,
) {
  assertEditorDocumentExportActive(options)

  if (value.startsWith("data:")) {
    const resource = validateEditorDocumentExportDataURL(value)
    budget.count += 1
    budget.bytes += resource.byteLength

    if (
      budget.count > editorDocumentExportLimits.maxResourceCount ||
      budget.bytes > editorDocumentExportLimits.maxTotalResourceBytes
    )
      throw new EditorDocumentExportError(
        "resource-limit",
        "Document images exceed the export limits.",
      )

    return Promise.resolve(value)
  }

  const url = validateEditorDocumentExportURL(value, documentURL)
  budget.count += 1

  if (budget.count > editorDocumentExportLimits.maxResourceCount)
    throw new EditorDocumentExportError(
      "resource-limit",
      "Document images exceed the export limits.",
    )

  const existing = budget.cache.get(url.href)

  if (existing)
    return existing.then((dataURL) => {
      assertEditorDocumentExportActive(options)
      budget.bytes += validateEditorDocumentExportDataURL(dataURL).byteLength
      assertEditorDocumentExportActive(options)

      if (budget.bytes > editorDocumentExportLimits.maxTotalResourceBytes)
        throw new EditorDocumentExportError(
          "resource-limit",
          "Document images exceed the export limits.",
        )

      return dataURL
    })

  const resource = (async () => {
    if (!options.resolveResource)
      throw new EditorDocumentExportError(
        "resource",
        "Document images need an approved resource resolver.",
      )

    let response: Response | undefined
    let abandoned = false
    let accepted = false
    let resolverStarted = false
    let responseSettled = false
    let releaseLifecycle: (() => void) | undefined

    const lifecycle = new Promise<void>((resolve) => {
      releaseLifecycle = resolve
    })

    void waitForEditorDocumentExport(lifecycle, options).catch(() => undefined)

    try {
      assertEditorDocumentExportActive(options)

      const resolverWork = Promise.resolve(
        options.resolveResource(new URL(url.href), {
          signal: options.signal,
          deadlineAt: options.deadlineAt,
        }),
      )

      resolverStarted = true

      const normalizedResolverWork = resolverWork.catch(
        parseEditorDocumentExportFailure,
      )

      const responseWork = normalizedResolverWork.then(
        async (resolved) => {
          response = resolved
          responseSettled = true

          if (abandoned) {
            await cancelExportResponseBody(resolved, options)
            releaseLifecycle?.()
          }

          return resolved
        },
        (error: Error) => {
          responseSettled = true
          releaseLifecycle?.()
          throw error
        },
      )

      const resolvedResponse = await waitForEditorDocumentExport(
        responseWork,
        options,
      )

      response = resolvedResponse
      accepted = true

      const result = await readEditorDocumentExportResource(
        resolvedResponse,
        { ...options, url },
        budget.bytes,
      )

      budget.bytes += result.byteLength

      return result.dataURL
    } catch (error) {
      if (error instanceof EditorDocumentExportError) throw error
      throw new EditorDocumentExportError(
        "resource",
        "A document image could not be loaded.",
      )
    } finally {
      if (accepted || !resolverStarted) releaseLifecycle?.()
      else if (responseSettled) {
        if (response)
          void cancelExportResponseBody(response, options).then(() =>
            releaseLifecycle?.(),
          )
        else releaseLifecycle?.()
      } else abandoned = true
    }
  })()

  budget.cache.set(url.href, resource)

  return resource
}

interface SVGExportAttribute {
  readonly name: string
  readonly value: string
}

interface SVGExportElement {
  readonly attributes: {
    readonly length: number
    item(index: number): SVGExportAttribute | null
  }
  readonly localName: string
  readonly namespaceURI: string | null
  readonly textContent: string | null
  getAttribute(name: string): string | null
}

interface SVGExportDocument {
  readonly root: SVGExportElement
  createTreeWalker(whatToShow: number): Pick<TreeWalker, "nextNode">
  querySelector(selector: string): SVGExportElement | null
  querySelectorAll(selector: string): ArrayLike<SVGExportElement>
}

interface SVGResourceBudget {
  count: number
  bytes: number
}

function validateSVGDataURL(
  value: string,
  budget: SVGResourceBudget,
  operation: EditorDocumentExportOperation,
) {
  assertEditorDocumentExportActive(operation)
  const resource = validateEditorDocumentExportDataURL(value)
  budget.count += 1
  budget.bytes += resource.byteLength

  if (
    budget.count > editorDocumentExportLimits.maxResourceCount ||
    budget.bytes > editorDocumentExportLimits.maxTotalResourceBytes
  )
    throw new EditorDocumentExportError(
      "resource-limit",
      "Image capture exceeded the SVG resource limits.",
    )
}

function validateSVGStyle(
  value: string,
  budget: SVGResourceBudget,
  operation: EditorDocumentExportOperation,
  preflightOnly = false,
) {
  assertEditorDocumentExportActive(operation)

  if (/[\\]|\/\*|@import/i.test(value))
    throw new EditorDocumentExportError(
      "svg",
      "Image capture returned an unsupported SVG style.",
    )

  const pattern = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)]*))\s*\)/gi
  let match: RegExpExecArray | null = null
  let found = false

  while ((match = pattern.exec(value))) {
    assertEditorDocumentExportActive(operation)
    found = true
    const url = (match[1] ?? match[2] ?? match[3] ?? "").trim()

    if (url.startsWith("#")) continue

    if (!url.startsWith("data:"))
      throw new EditorDocumentExportError(
        "svg",
        "Image capture returned an external SVG style resource.",
      )

    if (!preflightOnly) validateSVGDataURL(url, budget, operation)
  }

  if (/url\s*\(/i.test(value) && !found)
    throw new EditorDocumentExportError(
      "svg",
      "Image capture returned an invalid SVG style resource.",
    )
}

function validateSVGResourceAttributes(
  source: string,
  budget: SVGResourceBudget,
  operation: EditorDocumentExportOperation,
) {
  const tags = /<[A-Za-z_][\w:.-]*(?:[^>"']|"[^"]*"|'[^']*')*>/g
  const attributes = /\s+([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
  let tag: RegExpExecArray | null = null

  while ((tag = tags.exec(source))) {
    assertEditorDocumentExportActive(operation)
    attributes.lastIndex = 0
    let attribute: RegExpExecArray | null = null

    while ((attribute = attributes.exec(tag[0]))) {
      assertEditorDocumentExportActive(operation)
      const name = attribute[1]?.toLowerCase()

      if (name && svgURLAttributes.has(name))
        validateSVGStyle(
          attribute[2] ?? attribute[3] ?? "",
          budget,
          operation,
          true,
        )
    }
  }

  const styles = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi
  let style: RegExpExecArray | null = null

  while ((style = styles.exec(source))) {
    assertEditorDocumentExportActive(operation)
    validateSVGStyle(style[1] ?? "", budget, operation, true)
  }
}

function assertSupportedHTMLStyle(value: string) {
  if (/[\\]|\/\*|@import|image-set\s*\(/i.test(value))
    throw new EditorDocumentExportError(
      "resource",
      "Document contains an unsupported image style.",
    )

  const pattern = /url\s*\(\s*(?:"[^"]*"|'[^']*'|[^)]*)\s*\)/gi
  const urlCount = value.match(/url\s*\(/gi)?.length ?? 0
  let found = 0

  while (pattern.exec(value)) found += 1

  if (found !== urlCount)
    throw new EditorDocumentExportError(
      "resource",
      "Document contains an unsupported image style.",
    )
}

async function rewriteCSSURLs(
  value: string,
  documentURL: string,
  options: SnapshotOptions,
  budget: ResourceBudget,
) {
  assertEditorDocumentExportActive(options)
  assertSupportedHTMLStyle(value)
  const pattern = /url\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi
  const urlCount = value.match(/url\s*\(/gi)?.length ?? 0
  let match: RegExpExecArray | null = null
  let found = 0
  let rewritten = ""
  let offset = 0

  while ((match = pattern.exec(value))) {
    assertEditorDocumentExportActive(options)
    found += 1
    const resourceURL = (match[1] ?? match[2] ?? match[3] ?? "").trim()

    if (resourceURL.startsWith("#")) continue

    const dataURL = await resolveImage(
      resourceURL,
      documentURL,
      options,
      budget,
    )

    assertEditorDocumentExportActive(options)

    rewritten += `${value.slice(offset, match.index)}url("${dataURL}")`
    offset = pattern.lastIndex
  }

  if (urlCount !== found)
    throw new EditorDocumentExportError(
      "resource",
      "Document contains an unsupported image style.",
    )

  return rewritten ? rewritten + value.slice(offset) : value
}

function applyResolvedStyle(element: HTMLElement, options: SnapshotOptions) {
  const styleText = element.getAttribute("style")

  if (!styleText) return

  assertEditorDocumentExportActive(options)
  element.style.cssText = styleText
  assertEditorDocumentExportActive(options)
}

function assertSafeHTMLLink(input: Element["properties"][string]) {
  const value = exportString(input)

  if (value === undefined)
    throw new EditorDocumentExportError(
      "document",
      "Document contains an unsupported export link.",
    )

  let protocol: string

  try {
    protocol = new URL(value, "https://export.invalid").protocol
  } catch {
    throw new EditorDocumentExportError(
      "document",
      "Document contains an unsupported export link.",
    )
  }

  if (
    protocol !== "http:" &&
    protocol !== "https:" &&
    protocol !== "mailto:" &&
    protocol !== "tel:"
  )
    throw new EditorDocumentExportError(
      "document",
      "Document contains an unsupported export link.",
    )
}

function assertSupportedHTMLElement(element: Element) {
  const tagName = element.tagName.toLowerCase()

  if (unsupportedTags.has(tagName))
    throw new EditorDocumentExportError(
      "document",
      "Document contains unsupported media or active content.",
    )

  const attributes = Object.entries(element.properties)

  if (
    tagName === "meta" &&
    attributes.some(
      ([name, value]) =>
        name.toLowerCase() === "httpequiv" &&
        exportString(value)?.toLowerCase() === "refresh",
    )
  )
    throw new EditorDocumentExportError(
      "document",
      "Document contains unsupported active content.",
    )

  for (const [rawName, value] of attributes) {
    const name = rawName.toLowerCase()

    if (
      name.startsWith("on") ||
      unsupportedResourceAttributes.has(name) ||
      (name === "src" && tagName !== "img")
    )
      throw new EditorDocumentExportError(
        "document",
        "Document contains an unsupported resource attribute.",
      )

    if (name === "href") {
      if (tagName !== "a" && tagName !== "area")
        throw new EditorDocumentExportError(
          "document",
          "Document contains an unsupported resource attribute.",
        )

      assertSafeHTMLLink(value)
    }

    if (name === "style") {
      const style = exportString(value)

      if (style === undefined)
        throw new EditorDocumentExportError(
          "resource",
          "Document contains an unsupported image style.",
        )

      assertSupportedHTMLStyle(style)
    }
  }

  if (tagName === "img" && exportString(element.properties.src) === undefined)
    throw new EditorDocumentExportError(
      "resource",
      "Document contains an unsupported image source.",
    )
}

function preflightHTML(tree: Root, options: SnapshotOptions) {
  const pending: {
    readonly node: Root | Root["children"][number]
    readonly depth: number
  }[] = [{ node: tree, depth: 0 }]

  const elements: Element[] = []
  let nodeCount = 0

  for (const entry of pending) {
    assertEditorDocumentExportActive(options)

    nodeCount += 1

    if (
      nodeCount > editorDocumentExportLimits.maxDocumentNodes ||
      entry.depth > maxHTMLDepth
    )
      throw new EditorDocumentExportError(
        "document",
        "Document contains too many nodes to export.",
      )

    if (entry.node.type === "raw")
      throw new EditorDocumentExportError(
        "document",
        "Document contains unsupported raw HTML.",
      )

    if (entry.node.type === "element") {
      assertSupportedHTMLElement(entry.node)
      elements.push(entry.node)
    }

    if (entry.node.type === "root" || entry.node.type === "element")
      for (const child of entry.node.children)
        pending.push({ node: child, depth: entry.depth + 1 })
  }

  return elements
}

async function prepareHTMLForBrowser(
  html: string,
  documentURL: string,
  options: SnapshotOptions,
  budget: ResourceBudget,
) {
  assertEditorDocumentExportActive(options)
  const tree = fromHtml(html)
  assertEditorDocumentExportActive(options)
  const elements = preflightHTML(tree, options)

  for (const element of elements) {
    assertEditorDocumentExportActive(options)
    const style = exportString(element.properties.style)

    if (style !== undefined) {
      element.properties.style = await rewriteCSSURLs(
        style,
        documentURL,
        options,
        budget,
      )
      assertEditorDocumentExportActive(options)
    }

    if (element.tagName.toLowerCase() === "img") {
      const source = exportString(element.properties.src)

      if (source === undefined)
        throw new EditorDocumentExportError(
          "resource",
          "Document contains an unsupported image source.",
        )

      element.properties.src = await resolveImage(
        source,
        documentURL,
        options,
        budget,
      )
      assertEditorDocumentExportActive(options)
    }
  }

  assertEditorDocumentExportActive(options)
  const preparedHTML = toHtml(tree)
  assertEditorDocumentExportActive(options)

  return preparedHTML
}

function styleDeclarations(
  element: HTMLElement,
  operation: EditorDocumentExportOperation,
) {
  const declarations: string[] = []

  for (let index = 0; index < element.style.length; index += 1) {
    assertEditorDocumentExportActive(operation)
    const property = element.style.item(index)
    const value = element.style.getPropertyValue(property)
    declarations.push(`${property}:${value} !important`)
  }

  return declarations.join(";")
}

function styleRule(
  element: HTMLElement,
  selector: string,
  operation: EditorDocumentExportOperation,
) {
  const declarations = styleDeclarations(element, operation)

  return declarations ? `${selector}{${declarations}}` : ""
}

function makeExportStyle(
  token: string,
  rootWidth: number,
  purpose: SnapshotOptions["purpose"],
  bodyStyle: string,
  styleRules: readonly string[],
) {
  const root = `[data-editor-export-root="${token}"]`
  const width = purpose === "image" ? `${rootWidth}px` : "auto"

  return [
    `[data-editor-export-host="${token}"]{position:fixed!important;inset-block-start:0!important;inset-inline-start:-100000px!important;inline-size:${rootWidth}px!important;block-size:auto!important;overflow:clip!important;contain:layout paint!important;isolation:isolate!important;--editor-export-probe:1!important}`,
    `${root},${root} *{all:revert!important;box-sizing:border-box!important}`,
    `${root}[data-editor-export-probe="${token}"]{--editor-export-probe:1!important}`,
    `${root}{display:block!important;inline-size:${width}!important;min-inline-size:0!important;margin:0!important;${bodyStyle};position:relative!important;inset:auto!important;inset-block:auto!important;inset-inline:auto!important;inset-block-start:auto!important;inset-block-end:auto!important;inset-inline-start:auto!important;inset-inline-end:auto!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;z-index:auto!important;contain:layout paint!important;overflow:clip!important;isolation:isolate!important}`,
    `${root} img{max-inline-size:100%!important;block-size:auto!important}`,
    ...styleRules,
    `@page{margin:12mm}`,
  ].join("\n")
}

export function validateEditorDocumentExportSVG(
  value: string,
  parseSVG: (source: string) => SVGExportDocument,
  operation: EditorDocumentExportOperation,
  dimensions: { readonly width: number; readonly height: number },
) {
  assertEditorDocumentExportActive(operation)
  const prefix = "data:image/svg+xml;charset=utf-8,"

  if (
    !value.startsWith(prefix) ||
    value.length > editorDocumentExportLimits.maxSvgBytes * 3
  )
    throw new EditorDocumentExportError(
      "svg",
      "Image capture returned an invalid SVG payload.",
    )

  let source: string

  try {
    source = decodeURIComponent(value.slice(prefix.length))
  } catch {
    throw new EditorDocumentExportError(
      "svg",
      "Image capture returned an invalid SVG payload.",
    )
  }

  const sourceBytes = new TextEncoder().encode(source).byteLength
  assertEditorDocumentExportActive(operation)

  if (sourceBytes > editorDocumentExportLimits.maxSvgBytes)
    throw new EditorDocumentExportError(
      "resource-limit",
      "Image capture exceeded the SVG size limit.",
    )

  if (/<!DOCTYPE\b|<!ENTITY\b|<\?xml-stylesheet\b/i.test(source))
    throw new EditorDocumentExportError(
      "svg",
      "Image capture returned unsupported SVG declarations.",
    )

  const resourceBudget: SVGResourceBudget = { count: 0, bytes: 0 }
  validateSVGResourceAttributes(source, resourceBudget, operation)
  assertEditorDocumentExportActive(operation)
  const parsed = parseSVG(source)
  assertEditorDocumentExportActive(operation)
  const root = parsed.root

  const activeTags = new Set([
    "audio",
    "embed",
    "iframe",
    "object",
    "script",
    "video",
  ])

  if (
    root.localName !== "svg" ||
    root.namespaceURI !== "http://www.w3.org/2000/svg" ||
    Number(root.getAttribute("width")) !== dimensions.width ||
    Number(root.getAttribute("height")) !== dimensions.height ||
    root.getAttribute("viewBox") !==
      `0 0 ${dimensions.width} ${dimensions.height}`
  )
    throw new EditorDocumentExportError(
      "svg",
      "Image capture returned unsupported SVG content.",
    )

  assertEditorDocumentExportActive(operation)
  const walker = parsed.createTreeWalker(0xffffffff)
  let nodeCount = 1

  while (walker.nextNode()) {
    assertEditorDocumentExportActive(operation)
    nodeCount += 1

    if (nodeCount > editorDocumentExportLimits.maxDocumentNodes)
      throw new EditorDocumentExportError(
        "resource-limit",
        "Image capture exceeded the SVG node limit.",
      )
  }

  const elements = Array.from(parsed.querySelectorAll("*"))
  const nodes = [root, ...elements]
  assertEditorDocumentExportActive(operation)

  const parserError = parsed.querySelector("parsererror")
  assertEditorDocumentExportActive(operation)

  if (parserError)
    throw new EditorDocumentExportError(
      "svg",
      "Image capture returned unsupported SVG content.",
    )

  for (const element of nodes) {
    assertEditorDocumentExportActive(operation)

    if (activeTags.has(element.localName.toLowerCase()))
      throw new EditorDocumentExportError(
        "svg",
        "Image capture returned unsupported SVG content.",
      )

    for (let index = 0; index < element.attributes.length; index += 1) {
      assertEditorDocumentExportActive(operation)
      const attribute = element.attributes.item(index)

      if (!attribute) continue
      const name = attribute.name.toLowerCase()

      if (name.startsWith("on") || name === "srcset")
        throw new EditorDocumentExportError(
          "svg",
          "Image capture returned active SVG content.",
        )

      if (name === "href" || name === "xlink:href" || name === "src") {
        if (attribute.value.startsWith("#")) continue

        if (!attribute.value.startsWith("data:"))
          throw new EditorDocumentExportError(
            "svg",
            "Image capture returned an external SVG resource.",
          )

        validateSVGDataURL(attribute.value, resourceBudget, operation)
      }

      if (svgURLAttributes.has(name))
        validateSVGStyle(attribute.value, resourceBudget, operation)
    }
  }

  for (const style of Array.from(parsed.querySelectorAll("style"))) {
    assertEditorDocumentExportActive(operation)
    validateSVGStyle(style.textContent ?? "", resourceBudget, operation)
  }

  assertEditorDocumentExportActive(operation)

  return source
}

export async function createEditorDocumentExportSnapshot(
  html: string,
  editorRoot: HTMLElement,
  options: SnapshotOptions,
) {
  assertEditorDocumentExportActive(options)

  if (html.length > editorDocumentExportLimits.maxDocumentCharacters)
    throw new EditorDocumentExportError(
      "document",
      "Document is too large to export.",
    )

  const ownerDocument = editorRoot.ownerDocument
  const view = ownerDocument.defaultView

  if (!view || !ownerDocument.body || !ownerDocument.head)
    throw new EditorDocumentExportError(
      "document",
      "Document export needs a mounted browser document.",
    )

  const budget: ResourceBudget = { count: 0, bytes: 0, cache: new Map() }

  const preparedHTML = await prepareHTMLForBrowser(
    html,
    ownerDocument.URL,
    options,
    budget,
  )

  assertEditorDocumentExportActive(options)

  const parsed = new view.DOMParser().parseFromString(preparedHTML, "text/html")
  assertEditorDocumentExportActive(options)

  const unsupportedContent = parsed.querySelector(
    "script, iframe, object, embed, form, link, style, parsererror",
  )

  assertEditorDocumentExportActive(options)

  if (unsupportedContent)
    throw new EditorDocumentExportError(
      "document",
      "Document contains unsupported export content.",
    )

  assertEditorDocumentExportActive(options)
  const walker = parsed.createTreeWalker(parsed.body, view.NodeFilter.SHOW_ALL)
  let nodeCount = 1

  while (walker.nextNode()) {
    assertEditorDocumentExportActive(options)
    nodeCount += 1

    if (nodeCount > editorDocumentExportLimits.maxDocumentNodes)
      throw new EditorDocumentExportError(
        "document",
        "Document contains too many nodes to export.",
      )
  }

  const elements = Array.from(parsed.body.querySelectorAll("*"))
  assertEditorDocumentExportActive(options)
  const textLength = parsed.body.textContent?.length ?? 0
  assertEditorDocumentExportActive(options)

  if (textLength > editorDocumentExportLimits.maxDocumentCharacters)
    throw new EditorDocumentExportError(
      "document",
      "Document text is too large to export.",
    )

  const unsupported = elements.find((element) =>
    unsupportedTags.has(element.localName.toLowerCase()),
  )

  assertEditorDocumentExportActive(options)

  if (unsupported)
    throw new EditorDocumentExportError(
      "document",
      "Document contains unsupported media or active content.",
    )

  const token = `export-${++snapshotId}`
  const body = parsed.body
  const styleRules: string[] = []

  for (const element of [body, ...elements]) {
    assertEditorDocumentExportActive(options)
    element.removeAttribute("data-editor-export-style")
    element.removeAttribute("data-mention-id")
    element.removeAttribute("data-yopem-media")
  }

  applyResolvedStyle(body, options)
  assertEditorDocumentExportActive(options)
  const bodyStyle = styleDeclarations(body, options)
  body.removeAttribute("style")

  for (const element of elements) {
    assertEditorDocumentExportActive(options)

    if (!(element instanceof view.HTMLElement)) continue

    applyResolvedStyle(element, options)
    assertEditorDocumentExportActive(options)

    if (options.purpose === "image" && element.localName.toLowerCase() === "a")
      element.removeAttribute("href")

    if (element.localName.toLowerCase() === "img") {
      const source = element.getAttribute("src")

      if (!source || element.hasAttribute("srcset"))
        throw new EditorDocumentExportError(
          "resource",
          "Document contains an unsupported image source.",
        )

      validateEditorDocumentExportDataURL(source)
    }

    if (element.hasAttribute("style")) {
      const styleIndex = styleRules.length
      const id = `${token}-${styleIndex}`
      element.setAttribute("data-editor-export-style", id)
      styleRules.push(
        styleRule(element, `[data-editor-export-style="${id}"]`, options),
      )
      element.removeAttribute("style")
    }
  }

  assertEditorDocumentExportActive(options)

  const rootWidth =
    options.purpose === "image"
      ? Math.ceil(
          editorRoot.getBoundingClientRect().width ||
            editorRoot.clientWidth ||
            800,
        )
      : 1024

  assertEditorDocumentExportActive(options)

  if (
    options.purpose === "image" &&
    (!Number.isSafeInteger(rootWidth) ||
      rootWidth > editorDocumentExportLimits.maxWidth)
  )
    throw new EditorDocumentExportError(
      "dimensions",
      "Document is too wide for PNG export.",
    )

  const root = ownerDocument.createElement("div")
  root.setAttribute("data-editor-export-root", token)
  root.setAttribute("data-editor-export-probe", token)
  const direction = body.getAttribute("dir")

  if (direction) root.setAttribute("dir", direction)

  for (const child of Array.from(body.childNodes)) {
    assertEditorDocumentExportActive(options)
    root.append(ownerDocument.importNode(child, true))
  }

  const host = ownerDocument.createElement("div")
  host.setAttribute("data-editor-export-host", token)
  host.setAttribute("aria-hidden", "true")
  host.append(root)

  const stylesElement = ownerDocument.createElement("style")

  if (options.nonce) stylesElement.nonce = options.nonce
  stylesElement.textContent = makeExportStyle(
    token,
    rootWidth,
    options.purpose,
    bodyStyle,
    styleRules,
  )
  assertEditorDocumentExportActive(options)

  function dispose() {
    host.remove()
    stylesElement.remove()
  }

  try {
    ownerDocument.head.append(stylesElement)
    ownerDocument.body.append(host)

    const styleProbe = view
      .getComputedStyle(host)
      .getPropertyValue("--editor-export-probe")
      .trim()

    assertEditorDocumentExportActive(options)

    if (styleProbe !== "1")
      throw new EditorDocumentExportError(
        "document",
        "Document export styles were blocked. Supply an allowed CSP nonce.",
      )

    const width = Math.ceil(
      Math.max(
        root.scrollWidth,
        root.offsetWidth,
        root.getBoundingClientRect().width,
      ),
    )

    const height = Math.ceil(
      Math.max(
        root.scrollHeight,
        root.offsetHeight,
        root.getBoundingClientRect().height,
      ),
    )

    assertEditorDocumentExportActive(options)

    if (options.purpose === "image")
      validateEditorDocumentExportDimensions(width, height)

    assertEditorDocumentExportActive(options)

    return {
      root,
      styles: stylesElement,
      width,
      height,
      dispose,
    } satisfies EditorDocumentExportSnapshot
  } catch (error) {
    dispose()
    throw error
  }
}

export async function waitForEditorDocumentExportImages(
  root: HTMLElement,
  operation: EditorDocumentExportOperation,
) {
  const images = Array.from(root.querySelectorAll("img"))

  await Promise.all(
    images.map((image) => {
      assertEditorDocumentExportActive(operation)

      return waitForEditorDocumentExport(image.decode(), operation)
    }),
  )
  assertEditorDocumentExportActive(operation)
}
