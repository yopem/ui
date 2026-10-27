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
  "filter",
  "feDropShadow",
  "clipPath",
  "path",
  "use",
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
  "filter",
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
  "flood-color",
  "flood-opacity",
  "stdDeviation",
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
  "--mermaid-font-family",
  "-webkit-tap-highlight-color",
  "alignment-baseline",
  "animation",
  "background",
  "background-color",
  "border",
  "border-radius",
  "color",
  "cursor",
  "display",
  "filter",
  "dominant-baseline",
  "fill",
  "fill-opacity",
  "fill-rule",
  "font-family",
  "font-size",
  "font-style",
  "font-variant",
  "font-weight",
  "height",
  "letter-spacing",
  "line-height",
  "margin",
  "max-width",
  "opacity",
  "overflow",
  "padding",
  "paint-order",
  "pointer-events",
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
  "text-align",
  "text-anchor",
  "text-decoration",
  "text-transform",
  "vertical-align",
  "visibility",
  "white-space",
  "width",
  "word-spacing",
  "z-index",
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

export function assertEditorDiagramRenderActive(
  signal: AbortSignal,
  deadlineAt: number,
) {
  if (signal.aborted)
    throw new Error(
      signal.reason === "deadline"
        ? "Diagram rendering timed out."
        : "Diagram rendering was cancelled.",
    )

  if (!Number.isSafeInteger(deadlineAt) || Date.now() >= deadlineAt)
    throw new Error("Diagram rendering timed out.")
}

function untilAbort<T>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    function abort() {
      signal.removeEventListener("abort", abort)
      reject(
        new Error(
          signal.reason === "deadline"
            ? "Diagram rendering timed out."
            : "Diagram rendering was cancelled.",
        ),
      )
    }

    pending
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", abort))
      .catch(() => undefined)

    if (signal.aborted) {
      abort()

      return
    }

    signal.addEventListener("abort", abort, { once: true })
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

function validateStyleDimension(value: string, maximum: number) {
  const em = value.match(/^(\d+(?:\.\d+)?)em$/u)

  if (em) return Number(em[1]) > 0 && Number(em[1]) <= maximum / 16

  return validateDimension(value, maximum)
}

function isSafeDropShadow(value: string) {
  const match = value.match(
    /^drop-shadow\((\d+(?:\.\d+)?)px (\d+(?:\.\d+)?)px (\d+(?:\.\d+)?)px rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(?:0|1|0?\.\d+)\)\)$/u,
  )

  return (
    match !== null &&
    match.slice(1, 4).every((number) => Number(number) <= 64) &&
    match.slice(4, 7).every((number) => Number(number) <= 255)
  )
}

function isSafeFilter(value: string, ids: Set<string>) {
  return (
    value === "none" ||
    isSafeDropShadow(value) ||
    (/^url\(\s*(['"]?)#[A-Za-z_][\w:.-]*\1\s*\)$/iu.test(value) &&
      safeReference(value, ids))
  )
}

function sanitizeDeclarations(
  value: string,
  ids: Set<string>,
  animationSuffix = "",
) {
  const declarations = value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf(":")
      const property = part.slice(0, separator).trim().toLowerCase()
      const declaration = part.slice(separator + 1).trim()
      const important = declaration.endsWith("!important")

      const content = important
        ? declaration.slice(0, -"!important".length).trimEnd()
        : declaration

      const dimension = ["height", "max-width", "width"].includes(property)

      const safeAnimation =
        property !== "animation" ||
        content === "none" ||
        (animationSuffix !== "" &&
          [
            "dash 20s linear infinite",
            "dash 50s linear infinite",
            `dash-${animationSuffix} 20s linear infinite`,
            `dash-${animationSuffix} 50s linear infinite`,
          ].includes(content))

      const safeFilter = property !== "filter" || isSafeFilter(content, ids)

      const safeTapHighlight =
        property !== "-webkit-tap-highlight-color" ||
        /^rgba\(0,\s*0,\s*0,\s*0\)$/u.test(content)

      if (
        separator < 1 ||
        !styleProperties.has(property) ||
        !content ||
        !/^[A-Za-z0-9#(),.%+\-/'"_\s:]+$/u.test(content) ||
        !safeReference(content, ids) ||
        (important && !["fill", "stroke-dasharray"].includes(property)) ||
        (dimension && !validateStyleDimension(content, 4096)) ||
        !safeAnimation ||
        !safeFilter ||
        !safeTapHighlight
      )
        throw new Error("Diagram SVG contains unsafe style data.")

      const scopedContent =
        property === "animation" && content.startsWith("dash ")
          ? content.replace(/^dash/u, `dash-${animationSuffix}`)
          : content

      return `${property}:${scopedContent}${important ? "!important" : ""}`
    })

  return declarations.join(";")
}

function parseStylesheetRules(value: string) {
  const rules: { selector: string; body: string }[] = []
  let selectorStart = 0
  let bodyStart = 0
  let depth = 0
  let quote = ""
  let escaped = false

  for (let index = 0; index < value.length; index += 1) {
    const character = value.charAt(index)

    if (quote) {
      if (escaped) escaped = false
      else if (character === "\\") escaped = true
      else if (character === quote) quote = ""

      continue
    }

    if (character === "'" || character === '"') {
      quote = character

      continue
    }

    if (character === "{") {
      if (depth === 0) {
        if (!value.slice(selectorStart, index).trim())
          throw new Error("Diagram SVG contains invalid style data.")

        bodyStart = index + 1
      }

      depth += 1
    } else if (character === "}") {
      depth -= 1

      if (depth < 0) throw new Error("Diagram SVG contains invalid style data.")

      if (depth === 0) {
        rules.push({
          selector: value.slice(selectorStart, bodyStart - 1).trim(),
          body: value.slice(bodyStart, index).trim(),
        })
        selectorStart = index + 1
      }
    }
  }

  if (depth !== 0 || quote || value.slice(selectorStart).trim())
    throw new Error("Diagram SVG contains invalid style data.")

  return rules
}

function isSafeStylesheetSelector(selector: string, rootId: string) {
  const tokens = selector.trim().split(/\s+/u)

  if (
    tokens.every((token) =>
      /^(?:[A-Za-z][\w-]*|\.[A-Za-z_][\w-]*|#[A-Za-z_][\w-]*)$/u.test(token),
    )
  )
    return true

  if (!rootId || tokens[0] !== `#${rootId}` || tokens.length < 2) return false

  return tokens
    .slice(1)
    .every((token) =>
      /^(?:[A-Za-z][\w-]*|\.[A-Za-z_][\w-]*|\[data-[A-Za-z0-9_-]+="[A-Za-z0-9_-]+"\]|:(?:root|first-of-type|last-of-type|nth-of-type\(\d+\)|not\(\.[A-Za-z_][\w-]*\)))+$/u.test(
        token,
      ),
    )
}

function sanitizeStylesheet(value: string, ids: Set<string>, rootId: string) {
  if (byteLength(value) > maximumStyleBytes)
    throw new Error("Diagram SVG style data exceeds the size limit.")

  const output: string[] = []

  const animationSuffix = rootId.replace(
    /[^A-Za-z0-9_-]/gu,
    (character) => `-${character.charCodeAt(0).toString(16)}-`,
  )

  let includeReducedMotion = false

  for (const rule of parseStylesheetRules(value)) {
    if (rule.selector === "@media (prefers-reduced-motion: reduce)") {
      if (
        !rootId ||
        (rule.body !== "svg *{animation:none!important}" &&
          rule.body !== `#${rootId} *{animation:none!important}`)
      )
        throw new Error("Diagram SVG contains unsafe style data.")

      includeReducedMotion = true

      continue
    }

    const keyframeName = ["dash", "edge-animation-frame"].find(
      (name) =>
        rule.selector === `@keyframes ${name}` ||
        rule.selector === `@keyframes ${name}-${animationSuffix}`,
    )

    if (keyframeName) {
      if (!animationSuffix)
        throw new Error("Diagram SVG contains unsafe style data.")

      const frames = parseStylesheetRules(rule.body)
      const sanitizedFrames: string[] = []

      for (const frame of frames) {
        const declarations = sanitizeDeclarations(frame.body, ids)

        if (
          !["from", "to"].includes(frame.selector) ||
          declarations !== "stroke-dashoffset:0"
        )
          throw new Error("Diagram SVG contains unsafe style data.")

        sanitizedFrames.push(`${frame.selector}{${declarations}}`)
      }

      if (sanitizedFrames.length === 0)
        throw new Error("Diagram SVG contains invalid style data.")

      output.push(
        `@keyframes ${keyframeName}-${animationSuffix}{${sanitizedFrames.join("")}}`,
      )

      continue
    }

    if (rule.selector.startsWith("@") || rule.body.includes("{"))
      throw new Error("Diagram SVG contains invalid style data.")

    const selectors = rule.selector.split(",")

    if (
      selectors.some(
        (selector) => !isSafeStylesheetSelector(selector.trim(), rootId),
      )
    )
      throw new Error("Diagram SVG contains unsafe style selectors.")

    if (!rule.body) throw new Error("Diagram SVG contains invalid style data.")

    output.push(
      `${rule.selector}{${sanitizeDeclarations(rule.body, ids, animationSuffix)}}`,
    )
  }

  if (
    includeReducedMotion ||
    output.some((rule) => rule.includes("animation:dash-"))
  )
    output.push(
      `@media (prefers-reduced-motion: reduce){#${rootId} *{animation:none!important}}`,
    )

  const result = output.join("")

  if (byteLength(result) > maximumStyleBytes)
    throw new Error("Diagram SVG style data exceeds the size limit.")

  return result
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

function validateAttribute(
  attribute: Attr,
  element: Element,
  isHtml: boolean,
  ids: Set<string>,
) {
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

  if (name === "data-edge") return value === "true"

  if (name === "data-et") return value === "edge"

  if (
    ["data-id", "data-entity-1", "data-entity-2", "data-entity-uid"].includes(
      name,
    )
  )
    return /^[A-Za-z_][\w:.-]{0,127}$/u.test(value)

  if (name === "data-look")
    return ["classic", "handDrawn", "neo"].includes(value)

  if (name === "data-points") return /^[A-Za-z0-9+/]+={0,2}$/u.test(value)

  if (name === "data-source-line") return /^\d{1,7}$/u.test(value)

  if (name === "data-qualified-name")
    return byteLength(value) <= 4096 && safeReference(value, ids)

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

  if (
    element.localName === "filter" &&
    (name === "width" || name === "height") &&
    value.endsWith("%")
  ) {
    const percent = Number(value.slice(0, -1))

    return validateDimension(value, 4096) && percent > 0 && percent <= 200
  }

  if (element.localName === "feDropShadow") {
    if (name === "dx" || name === "dy") {
      const offset = Number(value)

      return Number.isFinite(offset) && Math.abs(offset) <= 64
    }

    if (name === "stdDeviation") {
      if (!value.trim()) return false

      const deviations = value.trim().split(/[ ,]+/u).map(Number)

      return (
        deviations.length <= 2 &&
        deviations.every(
          (deviation) =>
            Number.isFinite(deviation) && deviation >= 0 && deviation <= 64,
        )
      )
    }

    if (name === "flood-opacity") {
      const opacity = Number(value)

      return Number.isFinite(opacity) && opacity >= 0 && opacity <= 1
    }
  }

  if (name === "id") return ids.has(value)

  if (name === "class") return /^[A-Za-z0-9_ -]{0,256}$/u.test(value)

  if (name === "filter") return isSafeFilter(value, ids)

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
  const duplicateSuffixes = new Map<string, number>()
  const validId = /^[A-Za-z_][\w:.-]{0,127}$/u

  for (const element of elements) {
    let id = element.getAttribute("id")

    if (!id) continue

    if (!validId.test(id))
      throw new Error("Diagram SVG contains invalid identifiers.")

    if (ids.has(id)) {
      const plantUmlMessage =
        element.localName === "g" &&
        element.getAttribute("class")?.split(/\s+/u).includes("message") &&
        /^msg\d+$/u.test(id)

      if (!plantUmlMessage)
        throw new Error("Diagram SVG contains invalid identifiers.")

      let suffix = duplicateSuffixes.get(id) ?? 2
      let uniqueId = `${id}-${suffix}`

      while (ids.has(uniqueId)) {
        suffix += 1
        uniqueId = `${id}-${suffix}`
      }

      if (!validId.test(uniqueId))
        throw new Error("Diagram SVG contains invalid identifiers.")

      duplicateSuffixes.set(id, suffix + 1)
      element.setAttribute("id", uniqueId)
      id = uniqueId
    }

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
    if (!validateAttribute(attribute, element, html, ids))
      throw new Error("Diagram SVG contains an unsafe attribute.")

  if (tag === "style") {
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === 8 || child.nodeType === 7) child.remove()
      else if (child.nodeType !== 3)
        throw new Error("Diagram SVG contains unsupported content.")
    }

    element.textContent = sanitizeStylesheet(
      element.textContent ?? "",
      ids,
      root.getAttribute("id") ?? "",
    )

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
    assertEditorDiagramRenderActive(controller.signal, input.deadlineAt)

    const pending = Promise.resolve(
      renderer({ ...input, signal: controller.signal }),
    )

    if (Date.now() >= input.deadlineAt) controller.abort("deadline")

    const svg = await untilAbort(pending, controller.signal)
    assertEditorDiagramRenderActive(controller.signal, input.deadlineAt)

    const safeSvg = sanitizeEditorDiagramSvg(svg)
    assertEditorDiagramRenderActive(controller.signal, input.deadlineAt)
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
      assertEditorDiagramRenderActive(signal, Number.MAX_SAFE_INTEGER)
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
