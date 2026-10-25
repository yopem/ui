import { z } from "zod"

import {
  EDITOR_DIAGRAM_MAX_SOURCE_BYTES,
  EDITOR_DIAGRAM_MAX_SVG_BYTES,
  validateEditorDiagramSource,
  type EditorDiagramMetadata,
} from "./diagram-model"

const svgNamespace = "http://www.w3.org/2000/svg"

const xhtmlNamespace = "http://www.w3.org/1999/xhtml"

const xlinkNamespace = "http://www.w3.org/1999/xlink"

const maximumTimeoutMs = 120_000

const maximumElements = 10_000

const maximumDepth = 64

const maximumAttributeBytes = 262_144

const maximumStyleBytes = 32_768

const maximumPathBytes = 262_144

const svgTags = new Set([
  "svg",
  "g",
  "defs",
  "marker",
  "clipPath",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "title",
  "desc",
  "style",
  "linearGradient",
  "radialGradient",
  "stop",
  "foreignObject",
])

const htmlTags = new Set([
  "div",
  "span",
  "p",
  "br",
  "em",
  "strong",
  "b",
  "i",
  "code",
  "pre",
])

const svgAttributes = new Set([
  "id",
  "class",
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "viewBox",
  "preserveAspectRatio",
  "d",
  "points",
  "transform",
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-opacity",
  "opacity",
  "color",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "font-variant",
  "text-anchor",
  "dominant-baseline",
  "alignment-baseline",
  "baseline-shift",
  "letter-spacing",
  "word-spacing",
  "textLength",
  "lengthAdjust",
  "dx",
  "dy",
  "rotate",
  "vector-effect",
  "shape-rendering",
  "paint-order",
  "marker-start",
  "marker-mid",
  "marker-end",
  "clip-path",
  "clip-rule",
  "gradientUnits",
  "gradientTransform",
  "spreadMethod",
  "offset",
  "stop-color",
  "stop-opacity",
  "fx",
  "fy",
  "fr",
  "orient",
  "markerWidth",
  "markerHeight",
  "refX",
  "refY",
  "markerUnits",
  "href",
  "role",
  "aria-label",
  "aria-roledescription",
  "aria-labelledby",
  "aria-describedby",
  "focusable",
  "version",
  "xmlns",
  "xmlns:xlink",
  "xml:space",
])

const htmlAttributes = new Set([
  "class",
  "style",
  "xmlns",
  "role",
  "aria-label",
  "dir",
  "lang",
])

const styleProperties = new Set([
  "alignment-baseline",
  "background-color",
  "border",
  "border-radius",
  "color",
  "display",
  "dominant-baseline",
  "fill",
  "fill-opacity",
  "fill-rule",
  "font-family",
  "font-size",
  "font-style",
  "font-variant",
  "font-weight",
  "letter-spacing",
  "line-height",
  "margin",
  "opacity",
  "overflow",
  "padding",
  "paint-order",
  "position",
  "top",
  "left",
  "right",
  "bottom",
  "shape-rendering",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "text-anchor",
  "text-decoration",
  "text-transform",
  "vertical-align",
  "visibility",
  "white-space",
  "word-spacing",
])

export interface EditorDiagramRenderInput {
  diagram: EditorDiagramMetadata
  source: string
  signal: AbortSignal
  deadlineAt: number
}

export type EditorDiagramRenderer = (
  request: EditorDiagramRenderInput,
) => string | Promise<string>

export type EditorDiagramTransport = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>

function throwIfAborted(signal: AbortSignal, deadlineAt: number) {
  if (signal.aborted)
    throw new Error(
      signal.reason === "deadline"
        ? "Diagram rendering timed out."
        : "Diagram rendering was cancelled.",
    )

  if (Date.now() >= deadlineAt) throw new Error("Diagram rendering timed out.")
}

function untilAbort<T>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    function abort() {
      reject(
        new Error(
          signal.reason === "deadline"
            ? "Diagram rendering timed out."
            : "Diagram rendering was cancelled.",
        ),
      )
    }

    if (signal.aborted) {
      abort()

      return
    }

    signal.addEventListener("abort", abort, { once: true })
    pending
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", abort))
      .catch(() => undefined)
  })
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length
}

function safeReference(value: string, ids: Set<string>) {
  const urls = value.match(/url\([^)]*\)/giu) ?? []

  for (const url of urls) {
    const match = url.match(/^url\(\s*(['"]?)#([A-Za-z_][\w:.-]*)\1\s*\)$/iu)

    if (!match || !ids.has(match[2] ?? "")) return false
  }

  return !/(?:javascript\s*:|data\s*:|https?\s*:|file\s*:|url\s*\(|expression\s*\(|var\s*\(|@import)/iu.test(
    value.replace(/url\([^)]*\)/giu, ""),
  )
}

function sanitizeDeclarations(value: string, ids: Set<string>) {
  const declarations = value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf(":")
      const property = part.slice(0, separator).trim().toLowerCase()
      const content = part.slice(separator + 1).trim()

      if (
        separator < 1 ||
        !styleProperties.has(property) ||
        !content ||
        !/^[A-Za-z0-9#(),.%+\-/'"_\s:]+$/u.test(content) ||
        !safeReference(content, ids)
      )
        throw new Error("Diagram SVG contains unsafe style data.")

      return `${property}:${content}`
    })

  return declarations.join(";")
}

function sanitizeStylesheet(value: string, ids: Set<string>) {
  if (byteLength(value) > maximumStyleBytes)
    throw new Error("Diagram SVG style data exceeds the size limit.")

  const rules = value
    .split("}")
    .map((rule) => rule.trim())
    .filter(Boolean)

  const output: string[] = []

  for (const rule of rules) {
    const separator = rule.indexOf("{")
    const selectors = rule.slice(0, separator).trim()
    const declarations = rule.slice(separator + 1).trim()

    if (separator < 1 || !declarations)
      throw new Error("Diagram SVG contains invalid style data.")

    for (const selector of selectors.split(","))
      if (
        !selector
          .trim()
          .split(/\s+/u)
          .every((token) =>
            /^(?:[A-Za-z][\w-]*|\.[A-Za-z_][\w-]*|#[A-Za-z_][\w-]*)$/u.test(
              token,
            ),
          )
      )
        throw new Error("Diagram SVG contains unsafe style selectors.")

    output.push(`${selectors}{${sanitizeDeclarations(declarations, ids)}}`)
  }

  if (value.includes("{") && !value.trimEnd().endsWith("}"))
    throw new Error("Diagram SVG contains invalid style data.")

  return output.join("")
}

function validateDimension(value: string, maximum: number) {
  if (value.endsWith("%")) return /^\d+(?:\.\d+)?%$/u.test(value)
  const match = value.match(/^(\d+(?:\.\d+)?)(px|pt|pc|in|cm|mm)?$/u)

  if (!match) return false
  const units = match[2]

  const scale =
    units === "pt"
      ? 96 / 72
      : units === "pc"
        ? 16
        : units === "in"
          ? 96
          : units === "cm"
            ? 96 / 2.54
            : units === "mm"
              ? 96 / 25.4
              : 1

  const pixels = Number(match[1]) * scale

  return pixels > 0 && pixels <= maximum
}

function validateAttribute(attribute: Attr, isHtml: boolean, ids: Set<string>) {
  const name = attribute.name
  const value = attribute.value
  const normalizedName = name.toLowerCase()

  if (
    normalizedName.startsWith("on") ||
    byteLength(value) > maximumAttributeBytes
  )
    return false

  if (name === "xmlns")
    return value === (isHtml ? xhtmlNamespace : svgNamespace)

  if (name === "xmlns:xlink") return value === xlinkNamespace

  if (name === "xlink:href")
    return (
      attribute.namespaceURI === xlinkNamespace &&
      /^#[A-Za-z_][\w:.-]*$/u.test(value) &&
      ids.has(value.slice(1))
    )

  if (name === "style") {
    if (byteLength(value) > maximumStyleBytes) return false
    attribute.value = sanitizeDeclarations(value, ids)

    return true
  }

  if (name === "href")
    return /^#[A-Za-z_][\w:.-]*$/u.test(value) && ids.has(value.slice(1))

  if (isHtml) {
    if (!htmlAttributes.has(name)) return false

    if (name === "dir") return ["ltr", "rtl", "auto"].includes(value)

    if (name === "lang") return /^[A-Za-z0-9-]{1,35}$/u.test(value)

    if (name === "class") return /^[A-Za-z0-9_ -]{0,256}$/u.test(value)

    return safeReference(value, ids)
  }

  if (!svgAttributes.has(name)) return false

  if (name === "id") return ids.has(value)

  if (name === "class") return /^[A-Za-z0-9_ -]{0,256}$/u.test(value)

  if (name === "width" || name === "height")
    return validateDimension(value, 4096)

  if (name === "viewBox") {
    const values = value.trim().split(/[ ,]+/u).map(Number)

    return (
      values.length === 4 &&
      values.every(Number.isFinite) &&
      values[2] > 0 &&
      values[3] > 0 &&
      values[2] <= 8192 &&
      values[3] <= 8192
    )
  }

  if (name === "d") return byteLength(value) <= maximumPathBytes

  if (name === "role") return /^[A-Za-z -]{1,64}$/u.test(value)

  if (name === "aria-label" || name === "aria-roledescription")
    return byteLength(value) <= 4096

  if (name === "aria-labelledby" || name === "aria-describedby")
    return value
      .split(/\s+/u)
      .every((id) => /^[A-Za-z_][\w:.-]*$/u.test(id) && ids.has(id))

  if (name === "focusable") return value === "true" || value === "false"

  if (name === "version") return /^\d+(?:\.\d+){0,2}$/u.test(value)

  if (name === "xml:space") return value === "default" || value === "preserve"

  return (
    /^[A-Za-z0-9#(),.%+\-/'"_\s:]+$/u.test(value) && safeReference(value, ids)
  )
}

function collectIds(document: Document, elements: Element[]) {
  const ids = new Set<string>()

  for (const element of elements) {
    const id = element.getAttribute("id")

    if (!id) continue

    if (!/^[A-Za-z_][\w:.-]{0,127}$/u.test(id) || ids.has(id))
      throw new Error("Diagram SVG contains invalid identifiers.")

    ids.add(id)
  }

  if (document.doctype)
    throw new Error("Diagram SVG declarations are not allowed.")

  return ids
}

function elementDepth(element: Element, root: Element) {
  let depth = 0
  let parent = element.parentElement

  while (parent && parent !== root) {
    depth += 1

    if (depth > maximumDepth) return depth
    parent = parent.parentElement
  }

  return depth
}

function isInsideForeignObject(element: Element, root: Element) {
  let parent = element.parentElement

  while (parent && parent !== root) {
    if (
      parent.namespaceURI === svgNamespace &&
      parent.localName === "foreignObject"
    )
      return true
    parent = parent.parentElement
  }

  return false
}

function sanitizeElement(element: Element, root: Element, ids: Set<string>) {
  const namespace = element.namespaceURI
  const html = namespace === xhtmlNamespace
  const tag = element.localName
  const depth = elementDepth(element, root)

  if (
    depth > maximumDepth ||
    (html && !isInsideForeignObject(element, root)) ||
    (!html && namespace !== svgNamespace) ||
    !(html ? htmlTags : svgTags).has(tag)
  )
    throw new Error("Diagram SVG contains unsupported content.")

  for (const attribute of Array.from(element.attributes))
    if (!validateAttribute(attribute, html, ids))
      throw new Error("Diagram SVG contains an unsafe attribute.")

  if (tag === "style") {
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === 8 || child.nodeType === 7) child.remove()
      else if (child.nodeType !== 3)
        throw new Error("Diagram SVG contains unsupported content.")
    }

    element.textContent = sanitizeStylesheet(element.textContent ?? "", ids)

    return
  }

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === 8 || child.nodeType === 7) child.remove()
    else if (child.nodeType !== 1 && child.nodeType !== 3)
      throw new Error("Diagram SVG contains unsupported content.")
  }
}

export function sanitizeEditorDiagramSvg(svg: string): string {
  const parsed = z.string().safeParse(svg)

  if (!parsed.success)
    throw new Error("Diagram renderer did not return SVG text.")

  const source = parsed.data

  if (
    source.length === 0 ||
    source.length > EDITOR_DIAGRAM_MAX_SVG_BYTES ||
    byteLength(source) > EDITOR_DIAGRAM_MAX_SVG_BYTES ||
    /<!DOCTYPE|<!ENTITY/iu.test(source)
  )
    throw new Error("Diagram SVG is invalid or exceeds the size limit.")

  if (typeof DOMParser === "undefined")
    throw new Error("SVG sanitization is unavailable in this runtime.")

  const document = new DOMParser().parseFromString(source, "image/svg+xml")
  const root = document.documentElement

  if (
    root?.localName !== "svg" ||
    root.namespaceURI !== svgNamespace ||
    document.querySelector("parsererror")
  )
    throw new Error("Diagram renderer did not return a valid SVG document.")

  const elements = Array.from(document.getElementsByTagName("*"))

  if (elements.length > maximumElements || elements[0] !== root)
    throw new Error("Diagram SVG structure exceeds the size limit.")

  const ids = collectIds(document, elements)

  for (const element of elements) {
    if (!root.contains(element))
      throw new Error("Diagram SVG contains extra document content.")

    sanitizeElement(element, root, ids)
  }

  const result = root.outerHTML

  if (!result || byteLength(result) > EDITOR_DIAGRAM_MAX_SVG_BYTES)
    throw new Error("Diagram SVG exceeds the size limit.")

  return result
}

export async function renderEditorDiagram(
  input: EditorDiagramRenderInput,
  renderer: EditorDiagramRenderer,
): Promise<string> {
  const now = Date.now()

  if (
    !Number.isSafeInteger(input.deadlineAt) ||
    input.deadlineAt <= now ||
    input.deadlineAt - now > maximumTimeoutMs
  )
    throw new Error("Diagram rendering deadline is invalid.")

  validateEditorDiagramSource(input.source)
  const controller = new AbortController()
  const remainingMs = input.deadlineAt - now
  const timer = setTimeout(() => controller.abort("deadline"), remainingMs)
  let completed = false

  function cancel() {
    controller.abort(input.signal.reason ?? "cancelled")
  }

  input.signal.addEventListener("abort", cancel, { once: true })

  try {
    if (input.signal.aborted) cancel()
    throwIfAborted(controller.signal, input.deadlineAt)

    const result = renderer({ ...input, signal: controller.signal })
    throwIfAborted(controller.signal, input.deadlineAt)

    const svg = await untilAbort(Promise.resolve(result), controller.signal)
    throwIfAborted(controller.signal, input.deadlineAt)

    const safeSvg = sanitizeEditorDiagramSvg(svg)
    throwIfAborted(controller.signal, input.deadlineAt)
    completed = true

    return safeSvg
  } finally {
    clearTimeout(timer)
    input.signal.removeEventListener("abort", cancel)

    if (!completed) controller.abort()
  }
}

async function readBoundedSvg(response: Response, signal: AbortSignal) {
  const body = response.body

  if (!body) throw new Error("Diagram renderer returned an empty response.")

  const declaredLength = Number(response.headers.get("content-length"))

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > EDITOR_DIAGRAM_MAX_SVG_BYTES
  ) {
    await body.cancel()

    throw new Error("Diagram renderer output exceeds the size limit.")
  }

  const reader = body.getReader()
  const decoder = new TextDecoder("utf-8", { fatal: true })
  let bytes = 0
  let output = ""
  let completed = false

  try {
    while (true) {
      throwIfAborted(signal, Number.MAX_SAFE_INTEGER)
      const result = await untilAbort(reader.read(), signal)

      if (result.done) {
        completed = true
        break
      }

      bytes += result.value.byteLength

      if (bytes > EDITOR_DIAGRAM_MAX_SVG_BYTES) {
        await reader.cancel()

        throw new Error("Diagram renderer output exceeds the size limit.")
      }

      output += decoder.decode(result.value, { stream: true })
    }

    output += decoder.decode()

    return output
  } finally {
    if (!completed) await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

export function createEditorDiagramHttpRenderer(
  endpoint: string,
  transport: EditorDiagramTransport = fetch,
): EditorDiagramRenderer {
  if (
    !endpoint.startsWith("/") ||
    endpoint.startsWith("//") ||
    endpoint.includes("?") ||
    endpoint.includes("#") ||
    endpoint.includes("\\") ||
    endpoint.trim() !== endpoint
  )
    throw new Error("Diagram renderer endpoint must be a same-origin path.")

  const url = new URL(endpoint, "https://yopem.invalid")

  if (url.origin !== "https://yopem.invalid" || url.pathname !== endpoint)
    throw new Error("Diagram renderer endpoint must be a same-origin path.")

  return async (request) => {
    const body = JSON.stringify({
      version: 1,
      kind: request.diagram.kind,
      source: request.source,
    })

    if (byteLength(body) > EDITOR_DIAGRAM_MAX_SOURCE_BYTES + 512)
      throw new Error("Diagram request exceeds the size limit.")

    const response = await transport(url.pathname, {
      method: "POST",
      headers: {
        accept: "image/svg+xml",
        "content-type": "application/json",
      },
      body,
      signal: request.signal,
      credentials: "same-origin",
      redirect: "error",
      cache: "no-store",
    })

    if (
      !response.ok ||
      response.redirected ||
      response.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase() !== "image/svg+xml"
    ) {
      await response.body?.cancel().catch(() => undefined)

      throw new Error("Diagram renderer request failed.")
    }

    return readBoundedSvg(response, request.signal)
  }
}
