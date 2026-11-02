import { createEditorListPresentationHTMLConfig } from "@editor/list-presentation-extension"
import {
  editorListMarkerState,
  EDITOR_LIST_START_MAX,
  EDITOR_LIST_START_MIN,
  parseEditorListMarker,
  parseEditorListMarkerHTML,
  parseEditorListStart,
  parseEditorListStartHTML,
} from "@editor/list-presentation-model"
import { createHeadlessEditor } from "@lexical/headless"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import {
  $createListItemNode,
  $createListNode,
  ListItemNode,
  ListNode,
} from "@lexical/list"
import { withDOM } from "@workspace/tests/fixtures/lexical-dom"
import { expect, test } from "bun:test"
import {
  $createTextNode,
  $getRoot,
  $setState,
  type DOMConversionOutput,
  type DOMExportOutput,
  type HTMLConfig,
  type LexicalNode,
} from "lexical"

function parseHTML(source: string) {
  return {
    document: new window.DOMParser().parseFromString(source, "text/html"),
  }
}

function createListEditor(html?: HTMLConfig) {
  return createHeadlessEditor({
    namespace: "editor-list-presentation",
    html,
    nodes: [ListNode, ListItemNode],
    onError(error) {
      throw error
    },
  })
}

interface ConversionOutputHolder {
  output: DOMConversionOutput | null
}

interface ListNodeHolder {
  node: ListNode | null
}

function isHTMLElement(
  node: DOMExportOutput["element"] | undefined,
): node is HTMLElement {
  return node?.nodeType === 1
}

function withDocument<T>(run: (document: Document) => T) {
  return withDOM((window) => run(window.document))
}

test("list marker codec accepts only the eight supported native values", () => {
  const markers = [
    "disc",
    "circle",
    "square",
    "decimal",
    "lower-alpha",
    "upper-alpha",
    "lower-roman",
    "upper-roman",
  ] as const

  for (const marker of markers)
    expect(parseEditorListMarker(marker)).toBe(marker)

  expect(
    parseEditorListMarkerHTML({ marker: null, listStyleType: "circle" }),
  ).toBe("circle")
  expect(
    parseEditorListMarkerHTML({ marker: null, listStyleType: "georgian" }),
  ).toBeUndefined()
  expect(() =>
    parseEditorListMarkerHTML({ marker: "georgian", listStyleType: "disc" }),
  ).toThrow()
  expect(() => parseEditorListMarker("custom-marker")).toThrow()
})

test("native ordered starts accept bounded zero, negative, and positive integers", () => {
  for (const value of [
    EDITOR_LIST_START_MIN,
    -3,
    -1,
    0,
    1,
    4,
    EDITOR_LIST_START_MAX,
  ])
    expect(parseEditorListStart(value)).toBe(value)

  expect(parseEditorListStartHTML("0")).toBe(0)
  expect(parseEditorListStartHTML("-3")).toBe(-3)
  expect(parseEditorListStartHTML("7")).toBe(7)
  expect(parseEditorListStartHTML("2147483648")).toBeUndefined()
  expect(parseEditorListStartHTML("-2147483649")).toBeUndefined()

  for (const value of [
    NaN,
    Infinity,
    1.5,
    EDITOR_LIST_START_MAX + 1,
    EDITOR_LIST_START_MIN - 1,
  ])
    expect(() => parseEditorListStart(value)).toThrow()
})

test("Lexical JSON persists marker state on native ListNode", () => {
  const editor = createListEditor()

  editor.update(
    () => {
      const list = $createListNode("bullet").append(
        $createListItemNode().append($createTextNode("Bullet item")),
      )

      $setState(list, editorListMarkerState, "square")
      $getRoot().append(list)
    },
    { discrete: true },
  )

  expect(JSON.stringify(editor.getEditorState().toJSON())).toContain(
    '"yopemListMarker":"square"',
  )
})

test("HTML roundtrip keeps marker metadata, native starts, nested lists, and checklists", () => {
  withDocument(() => {
    const html = createEditorListPresentationHTMLConfig()
    const editor = createListEditor(html)

    editor.update(
      () => {
        const nested = $createListNode("number", -3).append(
          $createListItemNode().append($createTextNode("Nested item")),
        )

        const bullet = $createListNode("bullet").append(
          $createListItemNode().append($createTextNode("Parent item"), nested),
        )

        const ordered = $createListNode("number", 0).append(
          $createListItemNode().append($createTextNode("Ordered item")),
        )

        const checklist = $createListNode("check").append(
          $createListItemNode(false).append($createTextNode("Checklist item")),
        )

        $setState(bullet, editorListMarkerState, "circle")
        $getRoot().append(bullet, ordered, checklist)
      },
      { discrete: true },
    )

    const source = editor
      .getEditorState()
      .read(() => $generateHtmlFromNodes(editor), { editor })

    const roundtrip = createListEditor(html)

    const sourceDocument = parseHTML(
      `<!doctype html><html><body>${source}</body></html>`,
    ).document

    roundtrip.update(
      () => {
        $getRoot()
          .clear()
          .append(...$generateNodesFromDOM(roundtrip, sourceDocument))
      },
      { discrete: true },
    )

    const output = roundtrip
      .getEditorState()
      .read(() => $generateHtmlFromNodes(roundtrip), { editor: roundtrip })

    const result = parseHTML(
      `<!doctype html><html><body>${output}</body></html>`,
    ).document

    expect(
      result.querySelector<HTMLUListElement>(
        'ul[data-editor-list-marker="circle"]',
      )?.style.listStyleType,
    ).toBe("circle")
    expect(result.querySelector('ol[start="0"]')).not.toBeNull()
    expect(result.querySelector('ol[start="-3"]')).not.toBeNull()
    expect(
      result.querySelector('ul[data-editor-list-marker="circle"] > li > ol'),
    ).not.toBeNull()
    expect(
      result.querySelector('ul[__lexicallisttype="check"] li'),
    ).not.toBeNull()
  })
})

test.each(["replace", "null", "undefined"] as const)(
  "HTML composition keeps host import and export callbacks: %s",
  (replacement) => {
    withDocument((document) => {
      const editor = createListEditor()
      let importAfterCalls = 0
      let exportAfterCalls = 0

      const imports: NonNullable<HTMLConfig["import"]> = {
        ul: () => ({
          priority: 4,
          conversion() {
            return {
              node: $createListNode("bullet"),
              after(children) {
                importAfterCalls += 1

                return children
              },
            }
          },
        }),
      }

      const exports: NonNullable<HTMLConfig["export"]> = new Map([
        [
          ListNode,
          (_editor, node) => ({
            element: document.createElement("ul"),
            after(this: LexicalNode) {
              exportAfterCalls += 1
              expect(this).toBe(node)

              if (replacement === "null") return null

              if (replacement === "undefined") return undefined

              return document.createElement("ul")
            },
          }),
        ],
      ])

      const config = createEditorListPresentationHTMLConfig({
        import: imports,
        export: exports,
      })

      const element = document.createElement("ul")
      element.setAttribute("data-editor-list-marker", "square")
      const importer = config.import?.ul?.(element)

      if (!importer) throw new Error("Missing list importer")
      const imported: ConversionOutputHolder = { output: null }

      editor.update(
        () => {
          imported.output = importer.conversion(element)
        },
        { discrete: true },
      )

      const importOutput = imported.output

      if (!importOutput) throw new Error("Host list importer returned no nodes")
      importOutput.after?.([])
      expect(importAfterCalls).toBe(1)

      const markerEditor = createListEditor(config)
      const list: ListNodeHolder = { node: null }
      markerEditor.update(
        () => {
          list.node = $createListNode("bullet").append(
            $createListItemNode().append($createTextNode("Host item")),
          )
          $setState(list.node, editorListMarkerState, "square")
          $getRoot().append(list.node)
        },
        { discrete: true },
      )
      const exporter = config.export?.get(ListNode)
      const currentList = list.node

      if (!exporter || !currentList) throw new Error("Missing list exporter")

      const output = markerEditor
        .getEditorState()
        .read(() => exporter(markerEditor, currentList), {
          editor: markerEditor,
        })

      const result = output.after?.call(currentList, output.element)

      if (replacement !== "replace")
        expect(result).toBe(replacement === "null" ? null : undefined)
      const elementWithStyle = result ?? output.element

      const resultStyle = isHTMLElement(elementWithStyle)
        ? elementWithStyle.style.listStyleType
        : null

      expect(exportAfterCalls).toBe(1)
      expect(resultStyle).toBe("square")
    })
  },
)
