import { createDocumentEditor } from "@editor/document/convert"
import { createHeadlessEditor } from "@lexical/headless"
import {
  DocumentError,
  exportDocument,
  importDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { DocumentStatic } from "@yopem-ui/editor/document/static"
import {
  $createEditorFootnoteDefinitionNode,
  $createEditorFootnoteReferenceNode,
  EditorFootnoteDefinitionNode,
  EditorFootnoteReferenceNode,
} from "@yopem-ui/editor/footnote-node"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  isHTMLElement,
} from "lexical"
import { DOMParser, parseHTML } from "linkedom"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

function documentEditor() {
  return createDocumentEditor()
}

const referenceMarker = "data-editor-footnote-reference"

const linkMarker = "data-editor-footnote-reference-link"

const definitionMarker = "data-editor-footnote-definition"

const backlinkMarker = "data-editor-footnote-backlink"

function expectFootnoteRelationships(html: string) {
  const document = parseHTML(html).document
  const reference = document.querySelector(`sup[${referenceMarker}]`)
  const link = reference?.querySelector(`a[${linkMarker}]`)
  const definition = document.querySelector(`div[${definitionMarker}]`)
  const backlink = definition?.querySelector(`a[${backlinkMarker}]`)

  expect(reference).not.toBeNull()
  expect(link?.getAttribute("role")).toBe("doc-noteref")
  expect(reference?.getAttribute("role")).toBeNull()
  expect(definition?.getAttribute("role")).toBe("doc-footnote")
  expect(link?.getAttribute("href")).toBe(`#${definition?.getAttribute("id")}`)
  expect(backlink?.getAttribute("href")).toBe(
    `#${reference?.getAttribute("id")}`,
  )
}

test("document and static HTML place footnote roles on resolved links", () => {
  const instance = documentEditor()

  const source =
    '<p>Read<sup data-editor-footnote-reference="source-note">1</sup>.</p><div data-editor-footnote-definition="source-note"><p>Body.</p></div>'

  importDocument(instance, source, "html")
  const expected = instance.getEditorState().toJSON()
  const html = exportDocument(instance, "html")

  expectFootnoteRelationships(html)
  expect(parseDocument(html, "html")).toEqual(expected)

  const rendered = renderToStaticMarkup(createElement(DocumentStatic, { html }))

  expectFootnoteRelationships(rendered)
})

test.each([
  '<p>Read<sup data-editor-footnote-reference="source-note" id="reference" role="doc-noteref"><a data-editor-footnote-reference-link="" href="#definition">1</a></sup>.</p><div data-editor-footnote-definition="source-note" id="definition" role="doc-endnote"><p>Body.</p><a data-editor-footnote-backlink="" href="#reference">↩ 1</a></div>',
  '<p>Read<sup data-editor-footnote-reference="source-note" id="reference"><a data-editor-footnote-reference-link="" href="#definition" role="doc-noteref">1</a></sup>.</p><div data-editor-footnote-definition="source-note" id="definition" role="doc-footnote"><p>Body.</p><a data-editor-footnote-backlink="" href="#reference">↩ 1</a></div>',
])(
  "reader accepts canonical footnote markup and emits current roles",
  (source) => {
    const expected = parseDocument(source, "html")
    const instance = documentEditor()

    importDocument(instance, source, "html")
    expect(instance.getEditorState().toJSON()).toEqual(expected)
    expectFootnoteRelationships(exportDocument(instance, "html"))
  },
)

test.each([
  '<p><a role="doc-noteref" href="#definition">1</a></p>',
  '<p><span data-editor-footnote-reference="source-note">1</span></p>',
  '<p><sup data-editor-footnote-reference="source-note" id="bad id"><a data-editor-footnote-reference-link="" href="#definition" role="doc-noteref">1</a></sup></p><div data-editor-footnote-definition="source-note" id="definition" role="doc-footnote"><p>Body.</p></div>',
  '<p><sup data-editor-footnote-reference="source-note" id="reference" role="doc-noteref"><a data-editor-footnote-reference-link="" href="#definition" role="doc-noteref">1</a></sup></p><div data-editor-footnote-definition="source-note" id="definition" role="doc-footnote"><p>Body.</p></div>',
  '<p><sup data-editor-footnote-reference="source-note" id="reference"><a data-editor-footnote-reference-link="" role="doc-noteref">1</a></sup></p><div data-editor-footnote-definition="source-note" id="definition" role="doc-footnote"><p>Body.</p></div>',
  '<p><sup data-editor-footnote-reference="source-note" id="reference"><a data-editor-footnote-reference-link="" href="javascript:alert(1)" role="doc-noteref">1</a></sup></p><div data-editor-footnote-definition="source-note" id="definition" role="doc-footnote"><p>Body.</p></div>',
  '<p><sup data-editor-footnote-reference="source-note" id="reference"><a data-editor-footnote-reference-link="" href="#missing" role="doc-noteref">1</a></sup></p><div data-editor-footnote-definition="source-note" id="definition" role="doc-footnote"><p>Body.</p><a data-editor-footnote-backlink="" href="#reference">↩ 1</a></div>',
  '<p><sup data-editor-footnote-reference="source-note" id="reference"><a data-editor-footnote-reference-link="" href="#definition" role="doc-noteref">1</a></sup></p><div data-editor-footnote-definition="source-note" id="definition" role="doc-footnote"><p>Body.</p><a data-editor-footnote-backlink="" href="#missing">↩ 1</a></div>',
])("reader rejects unsafe or misplaced footnote markup: %s", (source) => {
  expect(() => parseDocument(source, "html")).toThrow(DocumentError)
})

test("live footnote reference keeps role on resolved anchor only", () => {
  const previousDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  )

  const document = new DOMParser().parseFromString(
    "<html><body></body></html>",
    "text/html",
  )

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: document,
  })

  try {
    const editor = createHeadlessEditor({
      namespace: "footnote-accessibility",
      nodes: [EditorFootnoteReferenceNode, EditorFootnoteDefinitionNode],
      onError(error) {
        throw error
      },
    })

    let referenceKey = ""
    let unresolvedKey = ""
    let definitionKey = ""

    editor.update(
      () => {
        const reference = $createEditorFootnoteReferenceNode("source-note")
        const unresolved = $createEditorFootnoteReferenceNode("remote-note")
        const definition = $createEditorFootnoteDefinitionNode("source-note")
        const body = $createParagraphNode().append($createTextNode("Body."))

        referenceKey = reference.getKey()
        unresolvedKey = unresolved.getKey()
        definitionKey = definition.getKey()
        definition.append(body)
        $getRoot().append(
          $createParagraphNode().append(reference, unresolved),
          definition,
        )
      },
      { discrete: true },
    )

    const reference = editor.getEditorState().read(() => {
      const node = $getNodeByKey(referenceKey)

      if (!(node instanceof EditorFootnoteReferenceNode))
        throw new Error("Footnote reference node is missing.")

      return { dom: node.createDOM(), view: node.decorate(editor) }
    })

    const unresolved = editor.getEditorState().read(() => {
      const node = $getNodeByKey(unresolvedKey)

      if (!(node instanceof EditorFootnoteReferenceNode))
        throw new Error("Unresolved footnote reference node is missing.")

      return node.decorate(editor)
    })

    const definitionRole = editor.getEditorState().read(() => {
      const node = $getNodeByKey(definitionKey)

      if (!(node instanceof EditorFootnoteDefinitionNode))
        throw new Error("Footnote definition node is missing.")
      const output = node.exportDOM(editor).element

      return isHTMLElement(output) ? output.getAttribute("role") : null
    })

    const referenceMarkup = renderToStaticMarkup(reference.view)
    const unresolvedMarkup = renderToStaticMarkup(unresolved)
    const referenceDocument = parseHTML(referenceMarkup).document
    const unresolvedDocument = parseHTML(unresolvedMarkup).document

    expect(reference.dom.getAttribute("role")).toBeNull()
    expect(
      referenceDocument.querySelector('a[role="doc-noteref"]'),
    ).not.toBeNull()
    expect(
      referenceDocument
        .querySelector("a[role=doc-noteref]")
        ?.getAttribute("href"),
    ).toMatch(/^#yopem-footnote-f[0-9a-z]+-definition-[A-Za-z0-9_-]+$/)
    expect(unresolvedDocument.querySelector("button")).not.toBeNull()
    expect(unresolvedDocument.querySelector('[role="doc-noteref"]')).toBeNull()
    expect(definitionRole).toBe("doc-footnote")
  } finally {
    if (previousDocument)
      Object.defineProperty(globalThis, "document", previousDocument)
    else Reflect.deleteProperty(globalThis, "document")
  }
})
