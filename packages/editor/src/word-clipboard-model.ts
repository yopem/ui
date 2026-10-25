import type {
  Element,
  ElementContent,
  Properties,
  Root,
  RootContent,
} from "hast"

import { toHtml } from "hast-util-to-html"
import { z } from "zod"

import type { MediaInput } from "./media/schema"

import {
  DocumentError,
  checkText,
  checkTree,
  parseHTMLSyntax,
  safeDocumentStyle,
} from "./document/boundary"
import { documentMediaSchema } from "./document/media"
import {
  EDITOR_LIST_START_MAX,
  EDITOR_LIST_START_MIN,
  editorListMarkerSchema,
  parseEditorListStart,
  type EditorListMarker,
} from "./list-presentation-model"
import { serializeMediaHtml } from "./media/html"

const resolverFunctionSchema = z.function({ input: [z.unknown(), z.unknown()] })

export interface WordClipboardImage {
  readonly source: string
  readonly alt: string
  readonly width?: number | undefined
  readonly height?: number | undefined
}

export type WordClipboardImageResolver = (
  image: WordClipboardImage,
) => MediaInput

interface OfficeStyleRule {
  readonly className: string
  readonly tagName?: string
  readonly declarations: ReadonlyMap<string, string>
}

interface WordListInfo {
  readonly group: string
  readonly listId: string
  readonly level: number
  readonly type: "bullet" | "number"
  readonly marker: EditorListMarker
  readonly start?: number
  readonly initialStart?: number
}

interface WordListParagraph {
  readonly info: WordListInfo
  readonly item: Element
}

interface OfficeListDescriptors {
  tabStop?: number | null
  marginLeft?: number
  textIndent?: number
}

interface OfficeListDefinition extends Readonly<OfficeListDescriptors> {
  readonly marker?: EditorListMarker
  readonly type?: "bullet" | "number"
  readonly start?: number
}

interface OfficeStylesheet {
  readonly rules: OfficeStyleRule[]
  readonly lists: ReadonlyMap<string, OfficeListDefinition>
  readonly hasListRules: boolean
}

interface NormalizedStyle {
  readonly block: ReadonlyMap<string, string>
  readonly text: ReadonlyMap<string, string>
  readonly indent?: number
}

interface ListFrame {
  readonly group: string
  readonly level: number
  readonly type: "bullet" | "number"
  readonly marker: EditorListMarker
  readonly list: Element
  readonly initialStart?: number
  lastItem: Element | null
  nextValue?: number
}

const maxWordImages = 50

const maxListLevel = 64

const maxOfficeListDefinitions = 256

const wordBulletMarkers = new Map<string, EditorListMarker>([
  ["•", "disc"],
  ["·", "disc"],
  ["-", "disc"],
  ["o", "circle"],
  ["○", "circle"],
  ["◦", "circle"],
  ["▪", "square"],
  ["■", "square"],
  ["□", "square"],
  ["\uf0b7", "disc"],
  ["\uf02d", "disc"],
])

const wordImageStyleProperties = new Set(["width", "height"])

const textStyleProperties = new Set([
  "background-color",
  "color",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "text-decoration",
  "text-transform",
])

const officeStyleMetadata = new Set([
  "mso-ansi-language",
  "mso-bidi-language",
  "mso-fareast-language",
  "mso-pagination",
  "mso-protection",
  "mso-style-id",
  "mso-style-name",
  "tab-interval",
])

const shellStyleMetadata = new Set([
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "page",
  "tab-interval",
])

const wordClasses = /^(?:Mso[A-Za-z0-9_-]*|(?:Word)?Section\d+)$/i

const contentTags = new Set([
  "a",
  "aside",
  "b",
  "blockquote",
  "br",
  "code",
  "col",
  "colgroup",
  "del",
  "details",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "input",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "s",
  "section",
  "strong",
  "sub",
  "sup",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
])

const inlineTags = new Set([
  "b",
  "code",
  "del",
  "em",
  "i",
  "mark",
  "s",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
])

const indentTags = new Set([
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "ol",
  "p",
  "table",
  "ul",
])

export function isWordClipboardHTML(source: string) {
  checkText(source)

  return (
    /\bmso-[a-z][\w-]*\s*:/i.test(source) ||
    /\bclass\s*=\s*(?:"[^"]*\bMso[^"]*"|'[^']*\bMso[^']*'|[^\s>]*\bMso)/i.test(
      source,
    ) ||
    /\.Mso[A-Za-z0-9_-]*\b/i.test(source)
  )
}

export function normalizeWordClipboardHTML(
  source: string,
  resolveImage?: WordClipboardImageResolver,
) {
  if (!isWordClipboardHTML(source)) return null

  try {
    const root = parseHTMLSyntax(source)
    const stylesheet = readOfficeStyleRules(root)
    const { rules } = stylesheet
    let imageCount = 0

    function makeImage(node: Element): Element {
      imageCount += 1

      if (imageCount > maxWordImages)
        throw new DocumentError(["Word clipboard exceeds the image limit."])

      if (!resolveImage)
        throw new DocumentError([
          "Word images require an explicit host resolver.",
        ])

      const attributes = node.properties
      const sourceURL = stringProperty(attributes.src)
      const alt = stringProperty(attributes.alt)

      if (!sourceURL || sourceURL.length > 1_048_576)
        throw new DocumentError(["Word image source is invalid."])

      const declarations = declarationsFor(node, rules)

      if (
        [...declarations.keys()].some(
          (property) =>
            !wordImageStyleProperties.has(property) &&
            !officeStyleMetadata.has(property),
        )
      )
        throw new DocumentError(["Unsupported Word image styling."])

      const width = imageDimension(attributes.width, declarations.get("width"))

      const height = imageDimension(
        attributes.height,
        declarations.get("height"),
      )

      const image = {
        source: sourceURL,
        alt,
        width,
        height,
      } satisfies WordClipboardImage

      let media: z.infer<typeof documentMediaSchema>

      try {
        const result: unknown = resolveImage(image)

        const then = z.util.isObject(result)
          ? resolverFunctionSchema.safeParse(result["then"])
          : null

        if (then?.success) {
          void new Promise<unknown>((resolve, reject) => {
            then.data.call(result, resolve, reject)
          }).catch(() => undefined)
          throw new DocumentError([
            "Word image resolver returned invalid media metadata.",
          ])
        }

        media = documentMediaSchema.parse(result)
      } catch (error) {
        if (error instanceof DocumentError) throw error
        throw new DocumentError([
          "Word image resolver returned invalid media metadata.",
        ])
      }

      if (media.kind !== "image")
        throw new DocumentError(["Word image resolver must return an image."])

      const parsed = parseHTMLSyntax(serializeMediaHtml(media)).children[0]

      if (parsed?.type !== "element")
        throw new DocumentError(["Word image resolver returned invalid media."])

      return parsed
    }

    function cleanChildren(
      children: readonly ElementContent[],
      inheritedTextStyle: ReadonlyMap<string, string>,
    ): ElementContent[] {
      const output: ElementContent[] = []
      let listParagraphs: WordListParagraph[] = []

      function flushLists() {
        if (listParagraphs.length)
          output.push(...buildWordLists(listParagraphs))
        listParagraphs = []
      }

      for (const child of children) {
        if (child.type === "element" && child.tagName === "p") {
          const list = readWordListParagraph(
            child,
            rules,
            stylesheet,
            inheritedTextStyle,
            cleanChildren,
          )

          if (list) {
            listParagraphs.push(list)
            continue
          }
        }

        flushLists()
        output.push(...cleanNode(child, inheritedTextStyle))
      }

      flushLists()

      return output
    }

    function cleanNode(
      node: ElementContent,
      inheritedTextStyle: ReadonlyMap<string, string>,
    ): ElementContent[] {
      if (node.type === "text") {
        if (!inheritedTextStyle.size) return [node]

        return [
          createElement("span", [node], {
            style: styleText(inheritedTextStyle),
          }),
        ]
      }

      if (node.type === "comment") {
        if (isBoundaryComment(node.value)) return []
        throw new DocumentError(["Unsupported Word clipboard comment."])
      }

      if (node.type !== "element")
        throw new DocumentError(["Unsupported Word clipboard node."])

      const tagName = node.tagName.toLowerCase()

      if (["style", "meta", "link", "title", "xml"].includes(tagName)) return []

      if (tagName === "script")
        throw new DocumentError([
          "Word clipboard contains unsupported active content.",
        ])

      if (tagName === "img") return [makeImage(node)]

      const classes = classNames(node.properties)
      const shell = ["html", "body", "head"].includes(tagName)

      const section =
        tagName === "div" &&
        classes.some((name) => /^(?:Word)?Section\d+$/i.test(name))

      if (tagName === "div" && !section)
        throw new DocumentError(["Unsupported Word clipboard block wrapper."])

      if (tagName === "head") return []

      if (
        !shell &&
        !section &&
        tagName !== "o:p" &&
        !contentTags.has(tagName) &&
        !inlineTags.has(tagName)
      )
        throw new DocumentError([
          `Unsupported Word clipboard element: ${tagName}.`,
        ])

      const declarations = declarationsFor(node, rules)
      const listValue = declarations.get("mso-list")

      if (listValue && !shell && !section && tagName !== "o:p")
        throw new DocumentError(["Word list metadata requires a paragraph."])

      const wrapper = shell || section
      const style = normalizeStyle(tagName, declarations, undefined, wrapper)
      const textStyle = mergeStyles(inheritedTextStyle, style.text)
      const properties = cleanProperties(node, style, textStyle)
      const inline = inlineTags.has(tagName) || tagName === "o:p"
      const childTextStyle = inline && tagName !== "a" ? new Map() : textStyle

      if ((shell || section) && style.block.size)
        throw new DocumentError(["Word wrapper block styles are unsupported."])

      if (tagName === "a" && style.block.size)
        throw new DocumentError(["Unsupported Word link styling."])

      if (tagName === "a" && containsTag(node, "img"))
        throw new DocumentError(["Word images inside links are unsupported."])

      const children = cleanChildren(node.children, childTextStyle)

      if (shell || section) return applyDirection(children, properties.dir)

      if (tagName === "o:p") {
        const inlineProperties = { ...properties }
        const inlineStyle = styleText(mergeStyles(textStyle, style.block))

        if (inlineStyle) inlineProperties.style = inlineStyle
        else delete inlineProperties.style

        return splitInlineElement(
          { ...node, tagName: "span", properties: inlineProperties, children },
          children,
        )
      }

      if (inlineTags.has(tagName)) {
        const inlineProperties = { ...properties }
        const inlineStyle = styleText(mergeStyles(textStyle, style.block))

        if (inlineStyle) inlineProperties.style = inlineStyle
        else delete inlineProperties.style
        const inlineNode = { ...node, properties: inlineProperties, children }

        return splitInlineElement(inlineNode, children)
      }

      if (tagName === "a") {
        const link = { ...node, properties, children }

        return [link]
      }

      const blockProperties = { ...properties }
      const blockStyle = styleText(style.block)

      if (blockStyle) blockProperties.style = blockStyle
      else delete blockProperties.style

      const block = { ...node, properties: blockProperties, children }

      if (tagName === "p" || /^h[1-6]$/.test(tagName))
        return splitParagraph(block, children)

      return [block]
    }

    const output: ElementContent[] = []

    for (const child of root.children) {
      if (child.type === "doctype") continue

      if (child.type === "comment") {
        if (isBoundaryComment(child.value)) continue
        throw new DocumentError(["Unsupported Word clipboard comment."])
      }

      output.push(...cleanNode(child, new Map()))
    }

    const cleaned: Root = { ...root, children: output }
    checkTree(cleaned)

    return toHtml(cleaned)
  } catch (error) {
    if (error instanceof DocumentError) throw error
    throw new DocumentError([
      error instanceof Error ? error.message : "Invalid Word clipboard HTML.",
    ])
  }
}

function readOfficeStyleRules(root: Root): OfficeStylesheet {
  const pending: RootContent[] = [...root.children]
  const rules: OfficeStyleRule[] = []
  const lists = new Map<string, OfficeListDefinition>()
  let hasListRules = false

  while (pending.length) {
    const node = pending.pop()

    if (node?.type !== "element") continue

    if (node.tagName.toLowerCase() === "style") {
      const stylesheet = parseOfficeStyleSheet(textContent(node))
      rules.push(...stylesheet.rules)
      hasListRules ||= stylesheet.hasListRules

      for (const [key, definition] of stylesheet.lists) {
        if (lists.has(key))
          throw new DocumentError(["Conflicting Word list definitions."])
        lists.set(key, definition)

        if (lists.size > maxOfficeListDefinitions)
          throw new DocumentError(["Word list definitions exceed the limit."])
      }

      continue
    }

    pending.push(...node.children)
  }

  return { rules, lists, hasListRules }
}

function parseOfficeStyleSheet(source: string) {
  const css = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--|-->/g, "")
    .replace(/@charset[^;]*;/gi, "")

  const rules: OfficeStyleRule[] = []
  const lists = new Map<string, OfficeListDefinition>()
  let hasListRules = false
  let offset = 0

  while (offset < css.length) {
    while (/\s/.test(css[offset] ?? "")) offset += 1

    if (offset >= css.length) break

    const open = css.indexOf("{", offset)

    if (open < 0) {
      if (css.slice(offset).trim())
        throw new DocumentError(["Invalid Word clipboard stylesheet."])
      break
    }

    const selector = css.slice(offset, open).trim()
    let depth = 1
    let close = open + 1

    for (; close < css.length && depth > 0; close += 1) {
      if (css[close] === "{") depth += 1

      if (css[close] === "}") depth -= 1

      if (depth > 64)
        throw new DocumentError([
          "Word clipboard stylesheet exceeds depth limit.",
        ])
    }

    if (depth !== 0)
      throw new DocumentError(["Invalid Word clipboard stylesheet."])

    const declarationsText = css.slice(open + 1, close - 1)

    if (depth !== 0 || declarationsText.includes("{"))
      throw new DocumentError(["Nested Word clipboard CSS is unsupported."])

    const declarations = parseDeclarations(
      declarationsText,
      /^@list(?:\s|$)/i.test(selector),
    )

    const listRule = /^@list\s+(l\d+)(?::level(\d+))?$/i.exec(selector)

    if (listRule) {
      hasListRules = true
      const identifier = listRule[1]
      const levelValue = listRule[2]

      if (
        !identifier ||
        identifier.length > 11 ||
        !Number.isSafeInteger(Number(identifier.slice(1)))
      )
        throw new DocumentError(["Invalid Word list definition."])

      if (levelValue === undefined) {
        if (
          [...declarations.keys()].some(
            (property) =>
              !["mso-list-id", "mso-list-template-ids"].includes(property),
          )
        )
          throw new DocumentError(["Unsupported Word list definition."])
        validateOfficeListIdentifiers(declarations)
      } else {
        const level = Number(levelValue)

        if (!Number.isInteger(level) || level < 1 || level > maxListLevel)
          throw new DocumentError(["Invalid Word list level."])
        const key = `${identifier.toLowerCase()}:${level}`

        if (lists.has(key))
          throw new DocumentError(["Conflicting Word list definitions."])
        lists.set(key, parseOfficeListDefinition(declarations, level))
      }

      offset = close
      continue
    }

    if (/^@page(?:\s|$)/i.test(selector)) {
      validateInertOfficeAtRule(declarations, "page")
      offset = close
      continue
    }

    if (/^@font-face(?:\s|$)/i.test(selector)) {
      validateInertOfficeAtRule(declarations, "font-face")
      offset = close
      continue
    }

    if (selector.startsWith("@"))
      throw new DocumentError(["Unsupported Word clipboard at-rule."])

    {
      for (const value of selector.split(",")) {
        const match =
          /^(?:(p|div|li|h[1-6]|span|table|tr|td|th)\s*)?\.([A-Za-z][A-Za-z0-9_-]*)$/i.exec(
            value.trim(),
          )

        if (!match)
          throw new DocumentError(["Unsupported Word clipboard CSS selector."])
        const className = match[2]

        if (!className || !wordClasses.test(className))
          throw new DocumentError(["Unsupported Word clipboard CSS class."])

        if (/^(?:Word)?Section\d+$/i.test(className)) {
          if (
            [...declarations.keys()].some(
              (property) =>
                ![
                  "mso-ansi-language",
                  "mso-element",
                  "mso-fareast-language",
                  "mso-pagination",
                  "page",
                ].includes(property),
            )
          )
            throw new DocumentError(["Word section styles are unsupported."])
          continue
        }

        rules.push(
          match[1]
            ? {
                className,
                tagName: match[1].toLowerCase(),
                declarations,
              }
            : { className, declarations },
        )
      }
    }

    offset = close
  }

  return { rules, lists, hasListRules }
}

function validateOfficeListIdentifiers(
  declarations: ReadonlyMap<string, string>,
) {
  for (const [property, value] of declarations) {
    const validListId =
      property === "mso-list-id" &&
      /^\d{1,10}$/.test(value) &&
      Number.isSafeInteger(Number(value)) &&
      Number(value) >= 0 &&
      Number(value) <= EDITOR_LIST_START_MAX

    const validTemplateIds =
      property === "mso-list-template-ids" &&
      /^-?\d{1,11}$/.test(value) &&
      Number.isSafeInteger(Number(value)) &&
      Number(value) >= EDITOR_LIST_START_MIN &&
      Number(value) <= EDITOR_LIST_START_MAX

    if (!validListId && !validTemplateIds)
      throw new DocumentError(["Invalid Word list identifier."])
  }
}

function parseOfficeListDefinition(
  declarations: ReadonlyMap<string, string>,
  level: number,
): OfficeListDefinition {
  let format: string | undefined
  let markerText: string | undefined
  let start: number | undefined
  let tabStop: number | null | undefined
  let marginLeft: number | undefined
  let textIndent: number | undefined
  let fontFamily: string | undefined
  let bidiFontFamily: string | undefined

  for (const [property, value] of declarations) {
    if (property === "mso-level-number-format") format = value.toLowerCase()
    else if (property === "mso-level-text") markerText = officeCssString(value)
    else if (property === "mso-level-start-at") {
      if (!/^\d{1,10}$/.test(value))
        throw new DocumentError(["Invalid Word list start."])
      start = parseEditorListStart(Number(value))
    } else if (property === "mso-level-tab-stop")
      tabStop = parseOfficeListTabStop(value, level)
    else if (property === "mso-level-number-position") {
      if (value.toLowerCase() !== "left")
        throw new DocumentError(["Unsupported Word list number position."])
    } else if (property === "margin-left")
      marginLeft = parseOfficeListMargin(value, level)
    else if (property === "text-indent")
      textIndent = parseOfficeListTextIndent(value)
    else if (property === "font-family")
      fontFamily = parseOfficeSymbolFont(value)
    else if (property === "mso-bidi-font-family")
      bidiFontFamily = parseOfficeSymbolFont(value)
    else
      throw new DocumentError([
        `Unsupported Word list definition property: ${property}.`,
      ])
  }

  if (
    (fontFamily !== undefined || bidiFontFamily !== undefined) &&
    (fontFamily !== "Symbol" ||
      bidiFontFamily !== "Symbol" ||
      format !== "bullet")
  )
    throw new DocumentError(["Unsupported Word list font metadata."])

  const descriptors: OfficeListDescriptors = {}

  if (tabStop !== undefined) descriptors.tabStop = tabStop

  if (marginLeft !== undefined) descriptors.marginLeft = marginLeft

  if (textIndent !== undefined) descriptors.textIndent = textIndent

  if (format === undefined) {
    if (
      markerText !== undefined ||
      start !== undefined ||
      Object.keys(descriptors).length === 0
    )
      throw new DocumentError(["Word list definition is incomplete."])

    return descriptors
  }

  if (format === "bullet") {
    if (markerText === undefined)
      throw new DocumentError(["Word list definition is incomplete."])
    const marker = wordBulletMarkers.get(markerText)

    if (!marker)
      throw new DocumentError(["Unsupported Word bullet marker definition."])

    if (start !== undefined)
      throw new DocumentError(["Bullet lists cannot define a start value."])

    return { marker, type: "bullet", ...descriptors }
  }

  const formats = new Map<string, EditorListMarker>([
    ["decimal", "decimal"],
    ["alpha-lower", "lower-alpha"],
    ["alpha-upper", "upper-alpha"],
    ["roman-lower", "lower-roman"],
    ["roman-upper", "upper-roman"],
  ])

  const marker = formats.get(format)

  if (!marker || (markerText !== undefined && markerText !== `%${level}.`))
    throw new DocumentError(["Unsupported Word ordered marker definition."])

  if (start === undefined) return { marker, type: "number", ...descriptors }

  return { marker, type: "number", start, ...descriptors }
}

function parseOfficeListTabStop(value: string, level: number) {
  if (value.toLowerCase() === "none") {
    if (level !== 1) throw new DocumentError(["Invalid Word list tab stop."])

    return null
  }

  const expected = (level - 1) * 36

  if (expected === 0 || parseOfficePointValue(value) !== expected)
    throw new DocumentError(["Invalid Word list tab stop."])

  return expected
}

function parseOfficeListMargin(value: string, level: number) {
  const expected = 24 + (level - 1) * 36

  if (parseOfficePointValue(value) !== expected)
    throw new DocumentError(["Invalid Word list margin."])

  return expected
}

function parseOfficeListTextIndent(value: string) {
  if (parseOfficePointValue(value) !== -24)
    throw new DocumentError(["Invalid Word list text indentation."])

  return -24
}

function parseOfficePointValue(value: string) {
  const match = /^(-?\d+(?:\.\d+)?)pt$/i.exec(value)

  if (!match?.[1]) throw new DocumentError(["Invalid Word list length."])
  const amount = Number(match[1])

  if (!Number.isFinite(amount) || Math.abs(amount) > 4096)
    throw new DocumentError(["Invalid Word list length."])

  return amount
}

function parseOfficeSymbolFont(value: string) {
  if (!/^(?:Symbol|"Symbol"|'Symbol')$/i.test(value))
    throw new DocumentError(["Unsupported Word list font metadata."])

  return "Symbol"
}

function officeCssString(value: string) {
  const first = value[0]
  const last = value.at(-1)

  if (first === '"' || first === "'") {
    if (last !== first || value.length < 2)
      throw new DocumentError(["Invalid Word CSS string."])

    value = value.slice(1, -1)
  } else if (last === '"' || last === "'")
    throw new DocumentError(["Invalid Word CSS string."])

  if (
    value.length > 32 ||
    (!wordBulletMarkers.has(value) && !/^%[1-9]\d?\.$/.test(value))
  )
    throw new DocumentError(["Invalid Word CSS string."])

  return value
}

function validateInertOfficeAtRule(
  declarations: ReadonlyMap<string, string>,
  kind: "font-face" | "page",
) {
  const allowed =
    kind === "font-face"
      ? new Set([
          "font-family",
          "panose-1",
          "mso-font-charset",
          "mso-generic-font-family",
          "mso-font-pitch",
          "mso-font-signature",
        ])
      : new Set([
          "size",
          "margin",
          "margin-bottom",
          "margin-left",
          "margin-right",
          "margin-top",
          "mso-header-margin",
          "mso-footer-margin",
          "mso-forms-protection",
          "mso-paper-source",
        ])

  for (const [property, value] of declarations) {
    if (
      !allowed.has(property) ||
      /url\s*\(|@import|expression\s*\(/i.test(value)
    )
      throw new DocumentError([`Unsupported Word @${kind} descriptor.`])

    const valid =
      kind === "font-face"
        ? property === "font-family"
          ? /^['"]?[\w -]{1,128}['"]?$/.test(value)
          : /^[\w .+-]{1,128}$/.test(value)
        : property === "size"
          ? /^(?:A4|A3|Letter|Legal|\d+(?:\.\d+)?pt(?:\s+\d+(?:\.\d+)?pt)?)$/i.test(
              value,
            )
          : property === "mso-forms-protection"
            ? /^(?:yes|no)$/i.test(value)
            : property === "mso-paper-source"
              ? /^\d{1,3}$/.test(value)
              : /^(?:0|\d+(?:\.\d+)?(?:pt|in|cm|mm))(?:(?:\s+)(?:0|\d+(?:\.\d+)?(?:pt|in|cm|mm))){0,3}$/i.test(
                  value,
                )

    if (!valid) throw new DocumentError([`Invalid Word @${kind} descriptor.`])
  }
}

function declarationsFor(node: Element, rules: readonly OfficeStyleRule[]) {
  const classes = new Set(classNames(node.properties))
  const declarations = new Map<string, string>()

  for (const rule of rules) {
    if (
      classes.has(rule.className) &&
      (!rule.tagName || rule.tagName === node.tagName.toLowerCase())
    )
      for (const [property, value] of rule.declarations)
        declarations.set(property, value)
  }

  const inlineStyle = node.properties.style

  if (inlineStyle !== undefined) {
    const parsedStyle = z.string().safeParse(inlineStyle)

    if (!parsedStyle.success)
      throw new DocumentError(["Invalid Word clipboard style attribute."])

    for (const [property, value] of parseDeclarations(parsedStyle.data))
      declarations.set(property, value)
  }

  const align = node.properties.align

  if (
    align !== undefined &&
    ["p", "li", "h1", "h2", "h3", "h4", "h5", "h6"].includes(
      node.tagName.toLowerCase(),
    )
  )
    declarations.set("text-align", String(align))

  return declarations
}

function classNames(properties: Properties) {
  const source = properties.className

  if (source === undefined) return []

  const values = z
    .union([
      z.string().transform((value) => value.split(/\s+/).filter(Boolean)),
      z.array(z.string()),
    ])
    .parse(source)

  if (values.some((value) => !wordClasses.test(value)))
    throw new DocumentError(["Unsupported Word clipboard class."])

  return values
}

function parseDeclarations(source: string, rejectConflicts = false) {
  const declarations = new Map<string, string>()

  for (const part of source.split(";")) {
    if (!part.trim()) continue
    const separator = part.indexOf(":")

    if (separator < 1)
      throw new DocumentError(["Invalid Word clipboard CSS declaration."])
    const property = part.slice(0, separator).trim().toLowerCase()
    const value = part.slice(separator + 1).trim()

    if (!/^[a-z][a-z0-9-]*$/.test(property) || !value)
      throw new DocumentError(["Invalid Word clipboard CSS declaration."])
    const previous = declarations.get(property)

    if (rejectConflicts && previous !== undefined && previous !== value)
      throw new DocumentError(["Conflicting Word clipboard CSS declarations."])
    declarations.set(property, value)
  }

  return declarations
}

function normalizeStyle(
  tagName: string,
  source: ReadonlyMap<string, string>,
  list: WordListInfo | undefined,
  shell: boolean,
): NormalizedStyle {
  const block = new Map<string, string>()
  const text = new Map<string, string>()
  let indent: number | undefined
  let listMargin: number | undefined

  function assignIndent(value: string) {
    const next = list
      ? parseWordListIndent(value, list.level)
      : parseWordIndent(value)

    if (list) {
      if (next !== list.level)
        throw new DocumentError([
          "Word list indentation does not match its level.",
        ])
      listMargin = next

      return
    }

    if (indent !== undefined && indent !== next)
      throw new DocumentError(["Conflicting Word paragraph indentation."])
    indent = next
  }

  for (const [property, sourceValue] of source) {
    let value = sourceValue

    if (property === "mso-list") {
      if (!list)
        throw new DocumentError(["Word list metadata requires a paragraph."])
      continue
    }

    if (property === "tab-stops") {
      if (!list)
        throw new DocumentError(["Word tab stops require a list paragraph."])
      parseWordListTabStops(value, list.level)
      continue
    }

    if (officeStyleMetadata.has(property)) continue

    if (shell && shellStyleMetadata.has(property)) continue

    if (property === "mso-para-margin-left" || property === "margin-left") {
      assignIndent(value)
      continue
    }

    if (property.startsWith("mso-"))
      throw new DocumentError([`Unsupported Word style: ${property}.`])

    if (property === "text-indent") {
      const converted = normalizeTextIndent(value, Boolean(list))

      if (converted === null) continue
      value = converted
    }

    const target =
      textStyleProperties.has(property) &&
      !(property === "background-color" && ["td", "th"].includes(tagName))
        ? text
        : block

    target.set(property, value)
  }

  if (list && listMargin !== undefined && listMargin !== list.level)
    throw new DocumentError(["Word list indentation does not match its level."])

  const style = styleText(block)

  if (style) safeDocumentStyle(style)
  const textStyle = styleText(text)

  if (textStyle) safeDocumentStyle(textStyle)

  if (indent === undefined) return { block, text }

  return { block, text, indent }
}

function normalizeTextIndent(value: string, list: boolean) {
  const match = /^(-?\d+(?:\.\d+)?)(pt|px|em|rem)$/i.exec(value)

  if (!match) {
    if (value === "0") return null

    return value
  }

  const amount = Number(match[1])
  const unit = match[2]?.toLowerCase()

  if (!Number.isFinite(amount) || !unit)
    throw new DocumentError(["Invalid Word text indentation."])

  if (amount === 0) return null

  if (amount < 0) {
    if (list && unit === "pt" && amount >= -36) return null
    throw new DocumentError(["Negative Word text indentation is unsupported."])
  }

  if (unit !== "pt") return value
  const pixels = amount * (4 / 3)

  return `${Number(pixels.toFixed(4))}px`
}

function parseWordIndent(value: string) {
  const match = /^([+-]?\d+(?:\.\d+)?)(pt|in|px)$/i.exec(value)

  if (!match)
    throw new DocumentError(["Unsupported Word paragraph indentation."])
  const amount = Number(match[1])
  const unit = match[2]?.toLowerCase()

  if (!Number.isFinite(amount) || amount < 0 || !unit)
    throw new DocumentError(["Invalid Word paragraph indentation."])

  if (amount === 0) return 0

  const points =
    unit === "pt" ? amount : unit === "in" ? amount * 72 : amount * 0.75

  const indent = points / 36

  if (!Number.isInteger(indent) || indent > 64)
    throw new DocumentError([
      "Word paragraph indentation must use 36-point steps.",
    ])

  return indent
}

function parseWordListIndent(value: string, level: number) {
  const match = /^([+-]?\d+(?:\.\d+)?)(pt|in|px)$/i.exec(value)

  if (!match?.[1] || !match[2])
    throw new DocumentError(["Unsupported Word paragraph indentation."])
  const amount = Number(match[1])
  const unit = match[2].toLowerCase()

  if (!Number.isFinite(amount) || amount < 0)
    throw new DocumentError(["Invalid Word paragraph indentation."])

  const points =
    unit === "pt" ? amount : unit === "in" ? amount * 72 : amount * 0.75

  const officeMargin = 24 + (level - 1) * 36
  const legacyMargin = level * 36

  if (points !== officeMargin && points !== legacyMargin)
    throw new DocumentError(["Word list indentation does not match its level."])

  return level
}

function parseWordListTabStops(value: string, level: number) {
  const match = /^list\s+(\d+(?:\.\d+)?)pt$/i.exec(value)
  const expected = (level - 1) * 36

  if (
    !match?.[1] ||
    expected === 0 ||
    !Number.isFinite(Number(match[1])) ||
    Number(match[1]) !== expected
  )
    throw new DocumentError(["Unsupported Word list tab stops."])

  return expected
}

function readWordListParagraph(
  node: Element,
  rules: readonly OfficeStyleRule[],
  stylesheet: OfficeStylesheet,
  inheritedTextStyle: ReadonlyMap<string, string>,
  cleanChildren: (
    children: readonly ElementContent[],
    inheritedTextStyle: ReadonlyMap<string, string>,
  ) => ElementContent[],
): WordListParagraph | null {
  const declarations = declarationsFor(node, rules)
  const raw = declarations.get("mso-list")

  if (raw === undefined) return null
  const info = parseWordListInfo(raw)
  const definition = stylesheet.lists.get(`${info.listId}:${info.level}`)

  if (stylesheet.hasListRules && !definition)
    throw new DocumentError(["Word list reference has no matching definition."])

  validateWordListParagraphMetadata(declarations, definition, info.level)
  const marker = removeWordListMarker(node.children, rules, definition)

  let resolvedInfo = info

  if (definition) {
    if (definition.type && definition.marker)
      resolvedInfo = {
        ...info,
        marker: definition.marker,
        type: definition.type,
      }

    if (definition.start !== undefined)
      resolvedInfo = { ...resolvedInfo, initialStart: definition.start }
  }

  const style = normalizeStyle("li", declarations, resolvedInfo, false)
  const textStyle = mergeStyles(inheritedTextStyle, style.text)
  const properties = cleanProperties(node, style, textStyle)
  const blockStyle = styleText(style.block)

  if (blockStyle) properties.style = blockStyle
  else delete properties.style
  const children = cleanChildren(marker.children, textStyle)
  const item = createElement("li", children, properties)

  if (
    definition?.type &&
    definition.marker &&
    (marker.type !== definition.type || marker.marker !== definition.marker)
  )
    throw new DocumentError(["Word list marker conflicts with its definition."])

  const normalizedInfo: WordListInfo = {
    ...resolvedInfo,
    marker: marker.marker,
    type: marker.type,
  }

  if ("start" in marker && marker.start !== undefined)
    return { info: { ...normalizedInfo, start: marker.start }, item }

  return { info: normalizedInfo, item }
}

function validateWordListParagraphMetadata(
  declarations: ReadonlyMap<string, string>,
  definition: OfficeListDefinition | undefined,
  level: number,
) {
  if (!definition) return

  for (const property of ["margin-left", "mso-para-margin-left"]) {
    const value = declarations.get(property)

    if (
      value !== undefined &&
      definition.marginLeft !== undefined &&
      parseOfficePointValue(value) !== definition.marginLeft
    )
      throw new DocumentError([
        "Word list margin conflicts with its definition.",
      ])
  }

  const textIndent = declarations.get("text-indent")

  if (
    textIndent !== undefined &&
    definition.textIndent !== undefined &&
    parseOfficePointValue(textIndent) !== definition.textIndent
  )
    throw new DocumentError([
      "Word list text indentation conflicts with its definition.",
    ])

  const tabStops = declarations.get("tab-stops")

  if (tabStops !== undefined) {
    const tabStop = parseWordListTabStops(tabStops, level)

    if (definition.tabStop !== undefined && definition.tabStop !== tabStop)
      throw new DocumentError([
        "Word list tab stops conflict with its definition.",
      ])
  }
}

function parseWordListInfo(value: string): WordListInfo {
  const match = /^l(\d+)\s+level(\d+)\s+lfo(\d+)$/i.exec(value.trim())

  if (!match) throw new DocumentError(["Unsupported Word list metadata."])
  const level = Number(match[2])
  const abstractList = match[1]
  const listOverride = match[3]

  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > maxListLevel ||
    !abstractList ||
    !listOverride ||
    abstractList.length > 10 ||
    listOverride.length > 10 ||
    !Number.isSafeInteger(Number(abstractList)) ||
    !Number.isSafeInteger(Number(listOverride))
  )
    throw new DocumentError(["Invalid Word list level."])

  return {
    group: `${abstractList}:${listOverride}`,
    listId: `l${abstractList}`,
    level,
    type: "bullet",
    marker: "disc",
  }
}

function removeWordListMarker(
  children: readonly ElementContent[],
  rules: readonly OfficeStyleRule[],
  definition?: OfficeListDefinition,
) {
  const definedMarker =
    definition?.type && definition.marker
      ? { type: definition.type, marker: definition.marker }
      : null

  let markerSpan: string | undefined
  let commentMarker: string | undefined
  let start = -1
  let end = -1
  const keep: ElementContent[] = []

  for (const [index, child] of children.entries()) {
    if (child.type !== "comment") continue

    const value = child.value.trim().toLowerCase()

    if (value.includes("[if !supportlists]")) {
      if (start >= 0) throw new DocumentError(["Invalid Word list marker."])
      start = index
    } else if (value.includes("[endif]")) {
      if (start < 0 || end >= 0)
        throw new DocumentError(["Invalid Word list marker."])
      end = index
    }
  }

  if (start >= 0 !== end >= 0 || (start >= 0 && end <= start))
    throw new DocumentError(["Invalid Word list marker comments."])

  if (start >= 0 && end >= 0)
    commentMarker = markerText(children.slice(start + 1, end))

  for (const [index, child] of children.entries()) {
    if (start >= 0 && end >= 0 && index >= start && index <= end) continue

    if (child.type === "element" && child.tagName.toLowerCase() === "span") {
      const declarations = declarationsFor(child, rules)
      const markerStyle = declarations.get("mso-list")

      if (markerStyle?.toLowerCase() === "ignore") {
        if (markerSpan !== undefined)
          throw new DocumentError(["Word list has multiple marker spans."])
        markerSpan = markerText(child.children)
        continue
      }
    }

    if (child.type !== "comment") keep.push(child)
  }

  if (markerSpan !== undefined && commentMarker !== undefined) {
    if (normalizeMarkerText(markerSpan) !== normalizeMarkerText(commentMarker))
      throw new DocumentError(["Conflicting Word list markers."])
  }

  const rawMarker = markerSpan ?? commentMarker

  if (rawMarker !== undefined) {
    const parsed = parseWordMarker(rawMarker)

    return { children: keep, ...parsed }
  }

  const first = keep[0]

  if (first?.type !== "text") {
    if (definedMarker) return { children: keep, ...definedMarker }
    throw new DocumentError(["Word list marker is missing."])
  }

  const match =
    /^[\t \u00a0]*(\d{1,10}[.)\\]|[A-Za-z]{1,8}\.|[•·▪◦○o])(?:[\t \u00a0]+)?/u.exec(
      first.value,
    )

  if (!match?.[1]) {
    if (definedMarker) return { children: keep, ...definedMarker }
    throw new DocumentError(["Word list marker is unsupported."])
  }

  const parsed = parseWordMarker(match[1])
  const remaining = first.value.slice(match[0].length)

  const output = remaining
    ? [{ ...first, value: remaining }, ...keep.slice(1)]
    : keep.slice(1)

  return { children: output, ...parsed }
}

function markerText(nodes: readonly ElementContent[]): string {
  let value = ""

  for (const node of nodes) {
    if (node.type === "text") {
      value += node.value
      continue
    }

    if (node.type === "comment") continue

    if (node.type !== "element")
      throw new DocumentError([
        "Word list marker contains unsupported content.",
      ])

    if (node.tagName.toLowerCase() !== "span")
      throw new DocumentError([
        "Word list marker contains unsupported content.",
      ])

    const properties = node.properties

    if (
      Object.keys(properties).some(
        (key) => !["className", "style"].includes(key),
      )
    )
      throw new DocumentError([
        "Word list marker contains unsupported attributes.",
      ])
    value += markerText(node.children)
  }

  return value
}

function parseWordMarker(source: string) {
  const marker = normalizeMarkerText(source)
  const decimal = /^(\d{1,10})[.)\\]$/.exec(marker)

  if (decimal?.[1]) {
    const start = Number(decimal[1])

    if (!Number.isSafeInteger(start) || String(start) !== decimal[1])
      throw new DocumentError(["Word list start is unsupported."])

    return { type: "number" as const, marker: "decimal" as const, start }
  }

  const symbol = wordBulletMarkers.get(marker)

  if (symbol) return { type: "bullet" as const, marker: symbol }

  const ordered = /^([A-Za-z]{1,8})\.$/.exec(marker)

  if (!ordered?.[1])
    throw new DocumentError(["Word list marker is unsupported."])
  const token = ordered[1]
  const isRoman = /^[ivxlcdm]+$/i.test(token)
  const start = isRoman ? romanValue(token) : alphabeticValue(token)

  const markerType: EditorListMarker = isRoman
    ? token === token.toUpperCase()
      ? "upper-roman"
      : "lower-roman"
    : token === token.toUpperCase()
      ? "upper-alpha"
      : "lower-alpha"

  return {
    type: "number" as const,
    marker: editorListMarkerSchema.parse(markerType),
    start,
  }
}

function romanValue(source: string) {
  const values = new Map([
    ["I", 1],
    ["V", 5],
    ["X", 10],
    ["L", 50],
    ["C", 100],
    ["D", 500],
    ["M", 1000],
  ])

  const token = source.toUpperCase()
  let total = 0
  let previous = 0

  for (let index = token.length - 1; index >= 0; index -= 1) {
    const value = values.get(token.charAt(index))

    if (value === undefined)
      throw new DocumentError(["Word Roman list marker is invalid."])
    total += value < previous ? -value : value
    previous = Math.max(previous, value)
  }

  if (total < 1 || total > 3999 || romanText(total) !== token)
    throw new DocumentError(["Word Roman list marker is invalid."])

  return total
}

function romanText(value: number) {
  const numerals: readonly [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ]

  let remaining = value
  let text = ""

  for (const [amount, numeral] of numerals)
    while (remaining >= amount) {
      text += numeral
      remaining -= amount
    }

  return text
}

function alphabeticValue(source: string) {
  let result = 0

  for (const character of source.toUpperCase())
    result = result * 26 + character.charCodeAt(0) - 64

  if (!Number.isSafeInteger(result) || result < 1 || result > 2_147_483_647)
    throw new DocumentError(["Word alphabetic list marker is invalid."])

  return result
}

function normalizeMarkerText(source: string) {
  return source
    .replaceAll("\u00a0", " ")
    .trim()
    .replace(/[\t\n\r ]+/g, "")
}

function buildWordLists(entries: readonly WordListParagraph[]) {
  const roots: Element[] = []
  const stack: ListFrame[] = []

  for (const entry of entries) {
    const { info, item } = entry

    if (info.level > stack.length + 1)
      throw new DocumentError(["Word list levels cannot skip."])

    while (stack.length > info.level) stack.pop()
    let frame = stack[info.level - 1]

    const compatible =
      frame?.group === info.group &&
      frame.type === info.type &&
      frame.marker === info.marker &&
      frame.initialStart === info.initialStart &&
      (info.type === "bullet" ||
        info.start === frame.nextValue ||
        (info.start === undefined && info.initialStart === frame.initialStart))

    if (!compatible) {
      if (
        info.initialStart !== undefined &&
        info.start !== undefined &&
        info.start !== info.initialStart
      )
        throw new DocumentError([
          "Word list start conflicts with its definition.",
        ])

      stack.length = info.level - 1

      const listProperties: Properties = {
        style: `list-style-type: ${info.marker}`,
      }

      const initialStart = info.start ?? info.initialStart

      if (info.type === "number" && initialStart !== undefined)
        listProperties.start = initialStart

      const list = createElement(
        info.type === "number" ? "ol" : "ul",
        [],
        listProperties,
      )

      if (info.level === 1) roots.push(list)
      else {
        const parent = stack[info.level - 2]

        if (!parent?.lastItem)
          throw new DocumentError(["Nested Word list has no parent item."])
        parent.lastItem.children.push(list)
      }

      frame = {
        group: info.group,
        level: info.level,
        type: info.type,
        marker: info.marker,
        list,
        lastItem: null,
      }

      if (info.initialStart !== undefined)
        frame = { ...frame, initialStart: info.initialStart }
      stack.push(frame)
    }

    if (!frame) throw new DocumentError(["Word list structure is invalid."])
    frame.list.children.push(item)
    frame.lastItem = item

    if (info.type === "number") {
      const itemStart = info.start ?? frame.nextValue ?? info.initialStart

      if (itemStart !== undefined) frame.nextValue = itemStart + 1
    }
  }

  return roots
}

function splitParagraph(node: Element, children: readonly ElementContent[]) {
  const output: ElementContent[] = []
  let inline: ElementContent[] = []

  function flush() {
    if (inline.length) output.push({ ...node, children: inline })
    inline = []
  }

  for (const child of children) {
    if (containsMedia(child)) {
      flush()
      output.push(child)
    } else inline.push(child)
  }

  flush()

  if (output.length === 0) output.push({ ...node, children: [] })

  return output
}

function splitInlineElement(
  node: Element,
  children: readonly ElementContent[],
): ElementContent[] {
  if (node.tagName.toLowerCase() === "a" && children.some(containsMedia))
    throw new DocumentError(["Word images inside links are unsupported."])

  if (!children.some(containsMedia))
    return [{ ...node, children: [...children] }]

  const output: ElementContent[] = []
  let inline: ElementContent[] = []

  function flush() {
    if (inline.length) output.push({ ...node, children: inline })
    inline = []
  }

  for (const child of children) {
    if (containsMedia(child)) {
      flush()
      output.push(child)
    } else inline.push(child)
  }

  flush()

  return output
}

function containsTag(node: ElementContent, tagName: string): boolean {
  if (node.type !== "element") return false

  if (node.tagName.toLowerCase() === tagName) return true

  return node.children.some((child) => containsTag(child, tagName))
}

function containsMedia(node: ElementContent): boolean {
  if (node.type !== "element") return false

  if (node.tagName === "figure" && node.properties.dataYopemMedia !== undefined)
    return true

  return node.children.some(containsMedia)
}

function applyDirection(
  children: readonly ElementContent[],
  direction: Properties[string],
) {
  if (direction === undefined) return [...children]

  if (direction !== "ltr" && direction !== "rtl")
    throw new DocumentError(["Invalid Word text direction."])

  return children.map((child) => {
    if (containsMedia(child)) return child

    if (child.type !== "element")
      return createElement("span", [child], { dir: direction })

    if (child.properties.dir !== undefined) return child

    return { ...child, properties: { ...child.properties, dir: direction } }
  })
}

function imageDimension(
  attribute: Properties[string],
  style: string | undefined,
) {
  const raw = attribute === undefined ? style : stringProperty(attribute)

  if (raw === undefined || raw === "") return undefined
  const dimension = /^(\d{1,4})(?:px)?$/.exec(raw)

  if (!dimension?.[1])
    throw new DocumentError(["Word image dimensions are invalid."])
  const value = Number(dimension[1])

  if (value < 1 || value > 4096)
    throw new DocumentError(["Word image dimensions exceed bounds."])

  return value
}

function cleanProperties(
  node: Element,
  style: NormalizedStyle,
  inheritedTextStyle: ReadonlyMap<string, string>,
) {
  const properties = { ...node.properties }
  delete properties.className
  delete properties.style
  delete properties.lang
  delete properties.xmlSpace

  const direction = properties.dir

  if (direction !== undefined && direction !== "ltr" && direction !== "rtl")
    throw new DocumentError(["Invalid Word text direction."])

  const align = properties.align

  if (
    align !== undefined &&
    !["left", "right", "center", "justify", "start", "end"].includes(
      String(align),
    )
  )
    throw new DocumentError(["Invalid Word paragraph alignment."])

  if (["p", "li", "h1", "h2", "h3", "h4", "h5", "h6"].includes(node.tagName))
    delete properties.align

  const indentAttribute = properties.dataEditorIndent

  if (style.indent !== undefined && indentAttribute !== undefined) {
    const parsed = Number(indentAttribute)

    if (!Number.isInteger(parsed) || parsed !== style.indent)
      throw new DocumentError(["Conflicting Word paragraph indentation."])
  }

  if (style.indent !== undefined && style.indent > 0) {
    if (!indentTags.has(node.tagName))
      throw new DocumentError(["Word indentation requires a block element."])
    properties.dataEditorIndent = style.indent
  }

  if (inheritedTextStyle.size && inlineTags.has(node.tagName)) {
    const combined = mergeStyles(inheritedTextStyle, style.text)
    const value = styleText(combined)

    if (value) properties.style = value
  }

  return properties
}

function styleText(style: ReadonlyMap<string, string>) {
  return safeDocumentStyle(
    [...style].map(([property, value]) => `${property}: ${value}`).join("; "),
  )
}

function mergeStyles(
  parent: ReadonlyMap<string, string>,
  child: ReadonlyMap<string, string>,
) {
  const output = new Map(parent)

  for (const [property, value] of child) output.set(property, value)

  return output
}

function textContent(node: RootContent): string {
  if (node.type === "text") return node.value

  if (node.type !== "element") return ""

  return node.children.map(textContent).join("")
}

function stringProperty(value: Properties[string]) {
  const parsed = z.union([z.string(), z.number()]).safeParse(value)

  return parsed.success ? String(parsed.data) : ""
}

function isBoundaryComment(value: string) {
  const normalized = value.trim().toLowerCase()

  return [
    "startfragment",
    "endfragment",
    "startselection",
    "endselection",
  ].includes(normalized)
}

function createElement(
  tagName: string,
  children: ElementContent[],
  properties: Properties = {},
): Element {
  return { type: "element", tagName, properties, children }
}
