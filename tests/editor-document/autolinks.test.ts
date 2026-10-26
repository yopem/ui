import { createHeadlessEditor } from "@lexical/headless"
import { AutoLinkNode } from "@lexical/link"
import {
  DocumentError,
  documentNodes,
  exportDocument,
  importDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import { parseHTML as parseDOM } from "linkedom"

const linkURL = "https://example.com/path"

const linkText = "https://example.com/path"

function editor() {
  return createHeadlessEditor({
    namespace: "document-autolinks",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })
}

function autoLinkNode(
  fields: { isUnlinked?: boolean | string; url?: string } = {},
) {
  return {
    type: "autolink",
    version: 1,
    url: linkURL,
    title: "Documentation",
    target: "_blank",
    rel: "nofollow noopener noreferrer",
    isUnlinked: false,
    children: [{ type: "text", version: 1, text: linkText }],
    ...fields,
  }
}

function documentJSON<Node extends { type: string; version: number }>(
  node: Node,
) {
  return JSON.stringify({
    root: {
      type: "root",
      version: 1,
      children: [
        {
          type: "paragraph",
          version: 1,
          children: [node],
        },
      ],
    },
  })
}

test("document headless editor registers upstream AutoLinkNode", () => {
  expect(documentNodes).toContain(AutoLinkNode)
})

test.each([false, true])(
  "native AutoLinkNode JSON round trips isUnlinked=%s exactly",
  (isUnlinked) => {
    const source = documentJSON(autoLinkNode({ isUnlinked }))
    const instance = editor()

    importDocument(instance, source, "json")
    const exported = exportDocument(instance, "json")
    const state = instance.getEditorState().toJSON()

    expect(JSON.parse(exported)).toEqual(state)
    expect(parseDocument(exported, "json")).toEqual(state)
    expect(exported).toContain('"type":"autolink"')
    expect(exported).toContain(`"isUnlinked":${isUnlinked}`)
  },
)

test("active auto links retain semantic HTML and Markdown links", () => {
  const instance = editor()

  importDocument(instance, documentJSON(autoLinkNode()), "json")

  const html = exportDocument(instance, "html")
  const markdown = exportDocument(instance, "markdown")

  for (const output of [html, markdown]) {
    const anchor = parseDOM(
      `<html><body>${output}</body></html>`,
    ).document.querySelector("a")

    expect(anchor?.getAttribute("href")).toBe(linkURL)
    expect(anchor?.getAttribute("title")).toBe("Documentation")
    expect(anchor?.getAttribute("target")).toBe("_blank")
    expect(anchor?.getAttribute("rel")).toBe("nofollow noopener noreferrer")
    expect(anchor?.textContent).toBe(linkText)
  }
})

test("unlinked auto links stay inert in HTML and Markdown output", () => {
  const instance = editor()

  importDocument(
    instance,
    documentJSON(autoLinkNode({ isUnlinked: true })),
    "json",
  )

  const html = exportDocument(instance, "html")
  const markdown = exportDocument(instance, "markdown")

  for (const output of [html, markdown]) {
    const document = parseDOM(`<html><body>${output}</body></html>`).document

    expect(document.querySelector("a")).toBeNull()
    expect(document.querySelector("[href]")).toBeNull()
    expect(document.body.textContent).toContain(linkText)
  }

  expect(JSON.stringify(parseDocument(markdown, "markdown"))).not.toContain(
    '"type":"link"',
  )
})

test.each([
  ["non-boolean isUnlinked", autoLinkNode({ isUnlinked: "true" })],
  ["missing isUnlinked", autoLinkNode({ isUnlinked: undefined })],
  [
    "isUnlinked on a manual link",
    { ...autoLinkNode({ isUnlinked: true }), type: "link" },
  ],
  [
    "isUnlinked on text",
    { type: "text", version: 1, text: linkText, isUnlinked: false },
  ],
  [
    "unsafe unlinked URL",
    autoLinkNode({ isUnlinked: true, url: "javascript:alert(1)" }),
  ],
] as const)("rejects malformed AutoLinkNode metadata: %s", (_name, node) => {
  expect(() => parseDocument(documentJSON(node), "json")).toThrow(DocumentError)
})
