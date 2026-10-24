import type { Root as HastRoot, Properties, RootContent } from "hast"
import type { Root } from "mdast"

import { fromHtml } from "hast-util-from-html"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import remarkStringify from "remark-stringify"
import { unified } from "unified"
import { z } from "zod"

export const EDITOR_FOOTNOTE_REFERENCE_TYPE = "editor-footnote-reference"

export const EDITOR_FOOTNOTE_DEFINITION_TYPE = "editor-footnote-definition"

export const EDITOR_FOOTNOTE_REFERENCE_ATTRIBUTE =
  "data-editor-footnote-reference"

export const EDITOR_FOOTNOTE_DEFINITION_ATTRIBUTE =
  "data-editor-footnote-definition"

export const editorFootnoteIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/)

const referenceSchema = z.strictObject({
  type: z.literal(EDITOR_FOOTNOTE_REFERENCE_TYPE),
  version: z.literal(1),
  identifier: editorFootnoteIdSchema,
})

const definitionSchema = z.looseObject({
  type: z.literal(EDITOR_FOOTNOTE_DEFINITION_TYPE),
  version: z.literal(1),
  identifier: editorFootnoteIdSchema,
  children: z.array(z.unknown()).max(10_000),
  direction: z.enum(["ltr", "rtl"]).nullable().optional(),
  format: z.string().max(16).optional(),
  indent: z.number().int().min(0).max(100).optional(),
})

const lexicalNodeSchema = z.looseObject({
  type: z.string().min(1).max(128),
  children: z.array(z.unknown()).max(10_000).optional(),
  $slots: z.record(z.string(), z.unknown()).optional(),
})

const documentSchema = z.looseObject({ root: z.unknown() })

const serializedDocumentLimits = { bytes: 1_048_576, depth: 64, nodes: 10_000 }

const htmlLimits = { bytes: 1_048_576, depth: 64, nodes: 10_000 }

const markdownLimits = { bytes: 1_048_576, depth: 64, nodes: 10_000 }

type FootnoteDocument = z.infer<typeof documentSchema>

function checkSize(value: FootnoteDocument | HastRoot, maxBytes: number) {
  let source: string

  try {
    source = z.string().parse(JSON.stringify(value))
  } catch {
    throw new Error("Invalid footnote data")
  }

  if (new TextEncoder().encode(source).byteLength > maxBytes)
    throw new Error("Footnote data is too large")
}

function inspectEditorFootnoteJSON(value: FootnoteDocument) {
  checkSize(value, serializedDocumentLimits.bytes)
  const document = documentSchema.parse(value)
  const root = lexicalNodeSchema.parse(document.root)

  if (root.type !== "root" || !root.children)
    throw new Error("Invalid footnote document root")

  const pending: { value: unknown; parent: string; depth: number }[] =
    root.children.map((child) => ({ value: child, parent: "root", depth: 1 }))

  let count = 1

  while (pending.length > 0) {
    const entry = pending.pop()

    if (!entry) break

    if (++count > serializedDocumentLimits.nodes)
      throw new Error("Footnote document has too many nodes")

    if (entry.depth > serializedDocumentLimits.depth)
      throw new Error("Footnote document is too deep")

    const node = lexicalNodeSchema.parse(entry.value)

    if (node.type === EDITOR_FOOTNOTE_REFERENCE_TYPE) {
      referenceSchema.parse(node)
    } else if (node.type === EDITOR_FOOTNOTE_DEFINITION_TYPE) {
      if (entry.parent !== "root")
        throw new Error("Footnote definitions must be document blocks")
      definitionSchema.parse(node)
    } else if (node.type.startsWith("editor-footnote-")) {
      throw new Error("Unsupported footnote node")
    }

    for (const child of node.children ?? [])
      pending.push({ value: child, parent: node.type, depth: entry.depth + 1 })

    for (const slot of Object.values(node.$slots ?? {}))
      pending.push({ value: slot, parent: node.type, depth: entry.depth + 1 })
  }
}

export const parseEditorFootnoteId = editorFootnoteIdSchema.parse.bind(
  editorFootnoteIdSchema,
)

export const parseEditorFootnoteReferenceNode =
  referenceSchema.parse.bind(referenceSchema)

export const parseEditorFootnoteDefinitionNode =
  definitionSchema.parse.bind(definitionSchema)

export function nextEditorFootnoteId(identifiers: readonly string[]) {
  const used = new Set(identifiers)
  let next = 1

  while (used.has(String(next))) next += 1

  return String(next)
}

const footnoteDocumentSchema = documentSchema.transform(
  function validateFootnoteDocument(value) {
    inspectEditorFootnoteJSON(value)
  },
)

export const validateEditorFootnotesJSON = footnoteDocumentSchema.parse.bind(
  footnoteDocumentSchema,
)

export const validateEditorFootnoteClipboardJSON =
  footnoteDocumentSchema.parse.bind(footnoteDocumentSchema)

export function editorFootnoteReferenceHTMLAttributes(identifier: string) {
  return {
    [EDITOR_FOOTNOTE_REFERENCE_ATTRIBUTE]: parseEditorFootnoteId(identifier),
  }
}

export function editorFootnoteDefinitionHTMLAttributes(identifier: string) {
  return {
    [EDITOR_FOOTNOTE_DEFINITION_ATTRIBUTE]: parseEditorFootnoteId(identifier),
  }
}

function parseFootnoteHTML(source: string) {
  if (
    source.length > htmlLimits.bytes ||
    new TextEncoder().encode(source).byteLength > htmlLimits.bytes ||
    source.includes("\0")
  )
    throw new Error("Invalid footnote HTML")
  const errors: string[] = []

  const tree = fromHtml(source, {
    fragment: true,
    onerror(error) {
      errors.push(error.reason)
    },
  })

  if (errors.length) throw new Error("Invalid footnote HTML")

  return tree
}

function htmlIdentifier(properties: Properties, name: string): string | null {
  const value = properties[name]

  if (value === undefined) return null

  return parseEditorFootnoteId(z.string().parse(value))
}

function inspectFootnoteHTML(source: string) {
  const tree = parseFootnoteHTML(source)
  checkSize(tree, htmlLimits.bytes)

  const pending: { node: RootContent; parent: string; depth: number }[] =
    tree.children.map((node) => ({ node, parent: "root", depth: 1 }))

  let count = 1

  while (pending.length > 0) {
    const entry = pending.pop()

    if (!entry) break

    if (++count > htmlLimits.nodes)
      throw new Error("Footnote HTML has too many nodes")

    if (entry.depth > htmlLimits.depth)
      throw new Error("Footnote HTML is too deep")

    const node = entry.node

    if (node.type !== "element") continue

    const properties = node.properties
    const reference = htmlIdentifier(properties, "dataEditorFootnoteReference")

    const definition = htmlIdentifier(
      properties,
      "dataEditorFootnoteDefinition",
    )

    if (reference && (node.tagName !== "sup" || definition))
      throw new Error("Invalid footnote reference HTML")

    if (definition && (node.tagName !== "div" || entry.parent !== "root"))
      throw new Error("Invalid footnote definition HTML")

    for (const child of node.children ?? [])
      pending.push({
        node: child,
        parent: definition ? "definition" : (node.tagName ?? "element"),
        depth: entry.depth + 1,
      })
  }
}

export function validateEditorFootnotesHTML(source: string) {
  inspectFootnoteHTML(source)
}

export function validateEditorFootnoteClipboardHTML(source: string) {
  inspectFootnoteHTML(source)
}

const markdownParser = unified().use(remarkParse).use(remarkGfm)

const markdownSerializer = unified().use(remarkGfm).use(remarkStringify)

function inspectFootnoteMarkdown(tree: Root) {
  const pending: { node: unknown; depth: number }[] = [{ node: tree, depth: 0 }]
  let count = 0
  let textBytes = 0

  while (pending.length > 0) {
    const entry = pending.pop()

    if (!entry) break

    if (++count > markdownLimits.nodes)
      throw new Error("Footnote Markdown has too many nodes")

    if (entry.depth > markdownLimits.depth)
      throw new Error("Footnote Markdown is too deep")

    const node = z
      .looseObject({
        type: z.string().min(1).max(128),
        identifier: z.unknown().optional(),
        children: z.array(z.unknown()).optional(),
      })
      .parse(entry.node)

    for (const value of Object.values(node)) {
      const text = z.string().safeParse(value)

      if (!text.success) continue

      if (text.data.length > markdownLimits.bytes - textBytes)
        throw new Error("Footnote Markdown text is too large")

      textBytes += new TextEncoder().encode(text.data).byteLength

      if (textBytes > markdownLimits.bytes)
        throw new Error("Footnote Markdown text is too large")
    }

    if (
      pending.length + (node.children?.length ?? 0) + count >
      markdownLimits.nodes
    )
      throw new Error("Footnote Markdown has too many nodes")

    if (node.type === "footnoteReference" || node.type === "footnoteDefinition")
      parseEditorFootnoteId(node.identifier)

    for (const child of node.children ?? [])
      pending.push({ node: child, depth: entry.depth + 1 })
  }
}

export function parseEditorFootnoteMarkdown(source: string): Root {
  if (
    source.length > markdownLimits.bytes ||
    new TextEncoder().encode(source).byteLength > markdownLimits.bytes ||
    source.includes("\0")
  )
    throw new Error("Footnote Markdown is too large or contains invalid text")
  const tree = markdownParser.parse(source)
  inspectFootnoteMarkdown(tree)

  return tree
}

export function serializeEditorFootnoteMarkdown(tree: Root) {
  inspectFootnoteMarkdown(tree)

  const source = markdownSerializer.stringify(tree)

  if (
    source.length > markdownLimits.bytes ||
    new TextEncoder().encode(source).byteLength > markdownLimits.bytes
  )
    throw new Error("Footnote Markdown is too large")

  return source
}
