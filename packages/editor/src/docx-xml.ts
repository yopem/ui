import { checkText, documentLimits, DocumentError } from "./document/boundary"

export type XmlChild = XmlNode | XmlText

export interface XmlText {
  type: "text"
  value: string
}

export interface XmlNode {
  type: "element"
  name: string
  namespaceURI: string
  attributes: Map<string, string>
  children: XmlChild[]
}

function invalidXmlCodePoint(codePoint: number) {
  return (
    (codePoint < 0x20 &&
      codePoint !== 0x9 &&
      codePoint !== 0xa &&
      codePoint !== 0xd) ||
    (codePoint >= 0xd800 && codePoint <= 0xdfff) ||
    codePoint === 0xfffe ||
    codePoint === 0xffff
  )
}

function fail(message: string): never {
  throw new DocumentError([message])
}

const wordNamespaces = new Set([
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  "http://purl.oclc.org/ooxml/wordprocessingml/main",
])

const relationshipNamespaces = new Set([
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  "http://purl.oclc.org/ooxml/officeDocument/relationships",
])

const defaultNamespaces = new Set([
  ...wordNamespaces,
  "http://schemas.openxmlformats.org/package/2006/relationships",
  "http://schemas.openxmlformats.org/package/2006/content-types",
])

const xmlNamespace = "http://www.w3.org/XML/1998/namespace"

export function assertSafeXml(source: string) {
  checkText(source)

  for (const character of source)
    if (invalidXmlCodePoint(character.codePointAt(0) ?? 0))
      fail("DOCX XML contains an unsafe declaration or character.")

  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(source))
    fail("DOCX XML contains an unsafe declaration or character.")

  const encoding = /<\?xml\b[^?]*\bencoding\s*=\s*(['"])([^'"]+)\1/i.exec(
    source,
  )?.[2]

  if (encoding && !/^utf-?8$/i.test(encoding)) fail("DOCX XML must use UTF-8.")
}

function decodeEntities(source: string) {
  let output = ""
  let offset = 0

  while (offset < source.length) {
    const ampersand = source.indexOf("&", offset)

    if (ampersand < 0) {
      output += source.slice(offset)
      break
    }

    output += source.slice(offset, ampersand)
    const semicolon = source.indexOf(";", ampersand + 1)

    if (semicolon < 0) fail("Invalid DOCX XML entity.")
    const entity = source.slice(ampersand + 1, semicolon)
    let decoded: string

    switch (entity) {
      case "amp":
        decoded = "&"
        break
      case "lt":
        decoded = "<"
        break
      case "gt":
        decoded = ">"
        break
      case "quot":
        decoded = '"'
        break
      case "apos":
        decoded = "'"
        break
      default: {
        const numeric = /^#(?:x([\da-f]+)|(\d+))$/i.exec(entity)

        const codePoint = numeric
          ? Number.parseInt(
              numeric[1] ?? numeric[2] ?? "",
              numeric[1] ? 16 : 10,
            )
          : Number.NaN

        if (
          !Number.isInteger(codePoint) ||
          (codePoint < 0x20 && ![0x9, 0xa, 0xd].includes(codePoint)) ||
          codePoint > 0x10ffff ||
          (codePoint >= 0xd800 && codePoint <= 0xdfff) ||
          codePoint === 0xfffe ||
          codePoint === 0xffff
        )
          fail("Invalid DOCX XML entity.")
        decoded = String.fromCodePoint(codePoint)
      }
    }

    output += decoded
    offset = semicolon + 1
  }

  return output
}

export function parseXml(source: string): XmlNode {
  assertSafeXml(source)
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source
  let offset = 0
  let nodes = 0

  function countNode(depth: number) {
    nodes++

    if (nodes > documentLimits.nodes) fail("DOCX XML exceeds its node budget.")

    if (depth > documentLimits.depth) fail("DOCX XML exceeds its depth limit.")
  }

  function skipSpace() {
    while (/[\t\n\r ]/.test(text[offset] ?? "")) offset++
  }

  function skipComment() {
    const end = text.indexOf("-->", offset + 4)

    if (end < 0 || text.slice(offset + 4, end).includes("--"))
      fail("Invalid DOCX XML comment.")
    offset = end + 3
  }

  function skipOutside() {
    while (offset < text.length) {
      skipSpace()

      if (text.startsWith("<!--", offset)) skipComment()
      else break
    }
  }

  function readName() {
    const start = offset

    if (!/[A-Za-z_]/.test(text[offset] ?? "")) fail("Invalid DOCX XML name.")
    offset++

    while (/[A-Za-z0-9_.:-]/.test(text[offset] ?? "")) offset++

    return text.slice(start, offset)
  }

  function readAttributeValue() {
    const quote = text[offset]

    if (quote !== '"' && quote !== "'") fail("Invalid DOCX XML attribute.")
    offset++
    const start = offset

    while (offset < text.length && text[offset] !== quote) {
      if (text[offset] === "<") fail("Invalid DOCX XML attribute.")
      offset++
    }

    if (offset >= text.length) fail("Unclosed DOCX XML attribute.")
    const value = decodeEntities(text.slice(start, offset))
    offset++

    return value
  }

  function readQualifiedName(name: string) {
    const match =
      /^([A-Za-z_][A-Za-z0-9_.-]*:)?([A-Za-z_][A-Za-z0-9_.-]*)$/.exec(name)

    if (!match) fail("Invalid DOCX XML qualified name.")

    return {
      prefix: match[1]?.slice(0, -1),
      localName: match[2] ?? "",
    }
  }

  function namespaceFor(
    prefix: string | undefined,
    namespaces: ReadonlyMap<string, string>,
    attribute = false,
  ) {
    if (!prefix) return attribute ? "" : (namespaces.get("") ?? "")
    const namespaceURI = namespaces.get(prefix)

    if (
      !namespaceURI ||
      (prefix === "w" && !wordNamespaces.has(namespaceURI)) ||
      (prefix === "r" && !relationshipNamespaces.has(namespaceURI)) ||
      (prefix === "xml" && (namespaceURI !== xmlNamespace || !attribute)) ||
      !["w", "r", "xml"].includes(prefix)
    )
      fail("Unsupported DOCX XML namespace.")

    return namespaceURI
  }

  function namespaceBindings(
    attributes: ReadonlyMap<string, string>,
    inherited: ReadonlyMap<string, string>,
  ) {
    const namespaces = new Map(inherited)

    for (const [name, value] of attributes) {
      if (name !== "xmlns" && !name.startsWith("xmlns:")) continue
      const prefix = name === "xmlns" ? "" : name.slice("xmlns:".length)

      if (
        name.startsWith("xmlns:") &&
        !/^xmlns:[A-Za-z_][A-Za-z0-9_.-]*$/.test(name)
      )
        fail("Invalid DOCX XML namespace declaration.")

      if (prefix && !["w", "r", "xml"].includes(prefix))
        fail("Unsupported DOCX XML namespace alias.")

      if (
        (prefix === "w" && !wordNamespaces.has(value)) ||
        (prefix === "r" && !relationshipNamespaces.has(value)) ||
        (prefix === "xml" && value !== xmlNamespace) ||
        (!prefix && value !== "" && !defaultNamespaces.has(value))
      )
        fail("Unsupported DOCX XML namespace.")

      if (namespaces.has(prefix) && namespaces.get(prefix) !== value)
        fail("DOCX XML namespace prefixes cannot be rebound.")
      namespaces.set(prefix, value)
    }

    return namespaces
  }

  function parseElement(
    depth: number,
    inherited: ReadonlyMap<string, string>,
  ): XmlNode {
    if (text[offset] !== "<" || text.startsWith("</", offset))
      fail("Invalid DOCX XML element.")
    offset++
    const name = readName()
    const attributes = new Map<string, string>()
    countNode(depth)
    let selfClosing = false

    while (offset < text.length) {
      skipSpace()

      if (text.startsWith("/>", offset)) {
        offset += 2
        selfClosing = true
        break
      }

      if (text[offset] === ">") {
        offset++
        break
      }

      const attribute = readName()
      skipSpace()

      if (text[offset] !== "=") fail("Invalid DOCX XML attribute.")
      offset++
      skipSpace()

      if (attributes.has(attribute)) fail("Duplicate DOCX XML attribute.")
      countNode(depth)
      attributes.set(attribute, readAttributeValue())
    }

    if (!selfClosing && text[offset - 1] !== ">")
      fail("Unclosed DOCX XML element.")
    const namespaces = namespaceBindings(attributes, inherited)
    const elementName = readQualifiedName(name)
    const namespaceURI = namespaceFor(elementName.prefix, namespaces)
    const expandedAttributes = new Set<string>()

    for (const attribute of attributes.keys()) {
      if (attribute === "xmlns" || attribute.startsWith("xmlns:")) continue
      const parsed = readQualifiedName(attribute)
      const attributeNamespace = namespaceFor(parsed.prefix, namespaces, true)

      if (
        wordNamespaces.has(namespaceURI)
          ? !(
              (parsed.prefix === "w" && attributeNamespace === namespaceURI) ||
              (parsed.prefix === "r" &&
                name === "w:hyperlink" &&
                parsed.localName === "id") ||
              (parsed.prefix === "xml" &&
                name === "w:t" &&
                parsed.localName === "space")
            )
          : parsed.prefix !== undefined
      )
        fail("Unexpected DOCX XML attribute namespace.")
      const expandedName = `${attributeNamespace}\u0000${parsed.localName}`

      if (expandedAttributes.has(expandedName))
        fail("Duplicate DOCX XML attribute.")
      expandedAttributes.add(expandedName)
    }

    if (selfClosing)
      return { type: "element", name, namespaceURI, attributes, children: [] }
    const children: XmlChild[] = []

    while (offset < text.length) {
      if (text.startsWith("</", offset)) {
        offset += 2
        const closingName = readName()
        skipSpace()

        if (text[offset] !== ">" || closingName !== name)
          fail("Mismatched DOCX XML element.")
        offset++

        return { type: "element", name, namespaceURI, attributes, children }
      }

      if (text.startsWith("<!--", offset)) {
        skipComment()
        continue
      }

      if (text.startsWith("<![CDATA[", offset)) {
        const end = text.indexOf("]]>", offset + 9)

        if (end < 0) fail("Unclosed DOCX XML CDATA.")
        const value = text.slice(offset + 9, end)

        if (value) {
          countNode(depth + 1)
          children.push({ type: "text", value })
        }

        offset = end + 3
        continue
      }

      if (text.startsWith("<?", offset) || text.startsWith("<!", offset))
        fail("Unsupported DOCX XML declaration.")

      if (text[offset] === "<") {
        const child = parseElement(depth + 1, namespaces)

        if (child.namespaceURI !== namespaceURI)
          fail(`Unexpected DOCX XML namespace in: ${name}.`)
        children.push(child)
        continue
      }

      const end = text.indexOf("<", offset)
      const stop = end < 0 ? text.length : end
      const value = decodeEntities(text.slice(offset, stop))

      if (value) {
        countNode(depth + 1)
        children.push({ type: "text", value })
      }

      offset = stop
    }

    return fail("Unclosed DOCX XML element.")
  }

  if (text.startsWith("<?xml", offset)) {
    const end = text.indexOf("?>", offset + 5)

    if (end < 0) fail("Invalid DOCX XML declaration.")
    offset = end + 2
  }

  skipOutside()

  if (offset >= text.length || text[offset] !== "<")
    fail("DOCX XML root element is missing.")
  const root = parseElement(0, new Map([["xml", xmlNamespace]]))
  skipOutside()

  if (offset !== text.length) fail("Trailing DOCX XML content.")

  return root
}

export function escapeXmlText(source: string) {
  for (const character of source)
    if (invalidXmlCodePoint(character.codePointAt(0) ?? 0))
      fail("DOCX export contains an invalid XML character.")

  return source
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

export function xmlAttribute(node: XmlNode, name: string) {
  return node.attributes.get(name)
}

export function xmlChildren(node: XmlNode, name?: string) {
  return node.children.filter(
    (child): child is XmlNode =>
      child.type === "element" && (name === undefined || child.name === name),
  )
}

export function xmlChild(node: XmlNode, name: string) {
  const matches = xmlChildren(node, name)

  if (matches.length > 1) fail(`Duplicate DOCX XML element: ${name}.`)

  return matches[0]
}

export function xmlText(node: XmlNode) {
  let output = ""

  for (const child of node.children) {
    if (child.type !== "text")
      fail(`Unexpected nested DOCX XML element: ${child.name}.`)
    output += child.value
  }

  return output
}
