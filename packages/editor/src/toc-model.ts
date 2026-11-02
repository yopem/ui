import { fromHtml } from "hast-util-from-html"
import { z } from "zod"

export const EDITOR_TOC_TYPE = "editor-toc"

export const EDITOR_TOC_HTML_ATTRIBUTE = "data-editor-toc"

const slotNameSchema = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/)
  .refine((name) => name !== "constructor" && name !== "prototype")

const slotValueSchema = z.looseObject({
  type: z.string().min(1).max(128),
  version: z.number().int().positive(),
})

const slotMapSchema = z
  .record(slotNameSchema, slotValueSchema)
  .refine((slots) => Object.keys(slots).length > 0)

export const editorTocNodeSchema = z
  .strictObject({
    type: z.literal(EDITOR_TOC_TYPE),
    version: z.literal(1),
    $: z.never({ error: "TOC NodeState is not supported" }).optional(),
    $slots: slotMapSchema.optional(),
  })
  .superRefine((toc, context) => {
    const pending: { value: unknown; depth: number }[] = Object.values(
      toc.$slots ?? {},
    ).map((value) => ({ value, depth: 1 }))

    let count = 1

    while (pending.length > 0) {
      const entry = pending.pop()

      if (!entry) break
      count++
      const node = nodeSchema.safeParse(entry.value)

      if (!node.success || count > limits.nodes || entry.depth > limits.depth) {
        context.addIssue({ code: "custom", message: "Invalid TOC slot tree" })

        return
      }

      for (const child of node.data.children ?? [])
        pending.push({ value: child, depth: entry.depth + 1 })

      if (node.data.$slots !== undefined) {
        const slots = slotMapSchema.safeParse(node.data.$slots)

        if (!slots.success) {
          context.addIssue({ code: "custom", message: "Invalid TOC slot map" })

          return
        }

        for (const value of Object.values(slots.data))
          pending.push({ value, depth: entry.depth + 1 })
      }
    }
  })

const documentSchema = z.looseObject({ root: z.unknown() })

const nodeSchema = z.looseObject({
  type: z.string().min(1).max(128),
  children: z.array(z.unknown()).max(10_000).optional(),
  $slots: z.record(z.string(), z.unknown()).optional(),
})

const htmlNodeSchema = z.looseObject({
  type: z.string(),
  tagName: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  children: z.array(z.unknown()).optional(),
  value: z.string().optional(),
})

const limits = { bytes: 1_048_576, depth: 64, nodes: 10_000 }

function meaningfulHTMLChildren(children: readonly unknown[]) {
  return children.filter((value) => {
    const node = htmlNodeSchema.parse(value)

    return node.type !== "text" || (node.value ?? "").trim().length > 0
  })
}

export const parseEditorTocNode =
  editorTocNodeSchema.parse.bind(editorTocNodeSchema)

export function createEditorTocHeadingId(scope: string, key: string) {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(scope))
    throw new Error("Invalid table of contents scope")

  if (!/^[A-Za-z0-9_-]{1,64}$/.test(key))
    throw new Error("Invalid table of contents heading key")
  const id = `yopem-toc-${scope}-heading-${key}`

  if (id.length > 128)
    throw new Error("Table of contents heading ID is too long")

  return id
}

export function editorTocHTMLAttributes() {
  return { [EDITOR_TOC_HTML_ATTRIBUTE]: "" }
}

export function validateEditorTocHTML(source: string) {
  if (
    source.length > limits.bytes ||
    new TextEncoder().encode(source).byteLength > limits.bytes ||
    source.includes("\0")
  )
    throw new Error(
      "Table of contents HTML is too large or contains invalid text",
    )

  const errors: string[] = []

  const tree = fromHtml(source, {
    fragment: true,
    onerror(error) {
      errors.push(error.reason)
    },
  })

  if (errors.length) throw new Error("Invalid table of contents HTML")

  const pending: { node: unknown; depth: number }[] = []

  for (const node of tree.children) pending.push({ node, depth: 1 })
  let count = 0

  while (pending.length > 0) {
    const entry = pending.pop()

    if (!entry) break

    if (++count > limits.nodes)
      throw new Error("Table of contents HTML has too many nodes")

    if (entry.depth > limits.depth)
      throw new Error("Table of contents HTML is too deep")

    const node = htmlNodeSchema.parse(entry.node)

    if (node.type !== "element") continue

    const properties = node.properties ?? {}
    const marker = properties.dataEditorToc

    if (marker !== undefined) {
      if (node.tagName !== "nav" || marker !== "")
        throw new Error("Invalid table of contents HTML marker")

      const lists = meaningfulHTMLChildren(node.children ?? [])

      if (lists.length > 1) throw new Error("Invalid table of contents HTML")

      for (const listValue of lists) {
        const list = htmlNodeSchema.parse(listValue)

        if (
          list.type !== "element" ||
          list.tagName !== "ol" ||
          Object.keys(list.properties ?? {}).length > 0
        )
          throw new Error("Invalid table of contents HTML")

        for (const itemValue of meaningfulHTMLChildren(list.children ?? [])) {
          const item = htmlNodeSchema.parse(itemValue)
          const itemChildren = meaningfulHTMLChildren(item.children ?? [])

          if (
            item.type !== "element" ||
            item.tagName !== "li" ||
            Object.keys(item.properties ?? {}).length > 0
          )
            throw new Error("Invalid table of contents HTML")

          if (itemChildren.length === 1) {
            const link = htmlNodeSchema.parse(itemChildren[0])
            z.string()
              .max(129)
              .regex(
                /^#yopem-toc-[A-Za-z0-9_-]{1,64}-heading-[A-Za-z0-9_-]{1,64}$/,
              )
              .parse(link.properties?.href)

            if (
              link.type !== "element" ||
              link.tagName !== "a" ||
              Object.keys(link.properties ?? {}).some(
                (key) => key !== "href",
              ) ||
              meaningfulHTMLChildren(link.children ?? []).some(
                (childValue) =>
                  htmlNodeSchema.parse(childValue).type !== "text",
              )
            )
              throw new Error("Invalid table of contents HTML")
          } else if (
            itemChildren.some(
              (childValue) => htmlNodeSchema.parse(childValue).type !== "text",
            )
          ) {
            throw new Error("Invalid table of contents HTML")
          }
        }
      }
    }

    for (const child of node.children ?? [])
      pending.push({ node: child, depth: entry.depth + 1 })
  }
}

const tocDocumentSchema = documentSchema.transform(
  function inspectTocDocument(value) {
    let source: string

    try {
      source = z.string().parse(JSON.stringify(value))
    } catch {
      throw new Error("Invalid table of contents document")
    }

    if (new TextEncoder().encode(source).byteLength > limits.bytes)
      throw new Error("Table of contents document is too large")

    const document = documentSchema.parse(value)
    const root = nodeSchema.parse(document.root)

    if (root.type !== "root" || !root.children)
      throw new Error("Invalid table of contents document root")

    const pending: { value: unknown; parent: string; depth: number }[] = []

    for (const child of root.children)
      pending.push({ value: child, parent: "root", depth: 1 })

    for (const slot of Object.values(root.$slots ?? {}))
      pending.push({ value: slot, parent: "root", depth: 1 })
    let count = 1

    while (pending.length > 0) {
      const entry = pending.pop()

      if (!entry) break

      if (++count > limits.nodes)
        throw new Error("Table of contents document has too many nodes")

      if (entry.depth > limits.depth)
        throw new Error("Table of contents document is too deep")

      const node = nodeSchema.parse(entry.value)

      if (node.type === EDITOR_TOC_TYPE) {
        if (entry.parent !== "root")
          throw new Error("Table of contents nodes must be document blocks")
        editorTocNodeSchema.parse(node)
      } else if (node.type.startsWith("editor-toc-")) {
        throw new Error("Unsupported table of contents node")
      }

      for (const child of node.children ?? [])
        pending.push({
          value: child,
          parent: node.type,
          depth: entry.depth + 1,
        })

      for (const slot of Object.values(node.$slots ?? {}))
        pending.push({ value: slot, parent: node.type, depth: entry.depth + 1 })
    }
  },
)

export const validateEditorTocJSON =
  tocDocumentSchema.parse.bind(tocDocumentSchema)
