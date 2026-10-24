import type { HTMLConfig } from "lexical"

import { createHeadlessEditor } from "@lexical/headless"
import { $createTableNodeWithDimensions, TableNode } from "@lexical/table"
import { createEditorBlockPresentationHTMLConfig } from "@yopem-ui/editor/block-presentation-extension"
import { documentNodes } from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import { $getRoot, $createParagraphNode, ParagraphNode } from "lexical"

test.each([null, undefined])(
  "canonical style HTML callbacks preserve removed output %s",
  (removed) => {
    const editor = createHeadlessEditor({
      namespace: "composition",
      nodes: documentNodes,
      onError(error) {
        throw error
      },
    })

    let exports = 0
    let afters = 0

    const previous: NonNullable<HTMLConfig["export"]> = new Map()

    function previousExport() {
      exports += 1

      return {
        element: null,
        after() {
          afters += 1

          return removed
        },
      }
    }

    previous.set(ParagraphNode, previousExport)
    previous.set(TableNode, previousExport)

    const config = createEditorBlockPresentationHTMLConfig(
      [ParagraphNode, TableNode],
      { export: previous },
    )

    editor.update(
      () => {
        const paragraph = $createParagraphNode()
        const table = $createTableNodeWithDimensions(1, 1)
        $getRoot().append(paragraph, table)

        for (const [klass, node] of [
          [ParagraphNode, paragraph],
          [TableNode, table],
        ] as const) {
          const exporter = config.export?.get(klass)
          expect(exporter).toBeDefined()
          const output = exporter?.(editor, node)
          expect(output?.element).toBeNull()
          expect(output?.after?.(undefined)).toBe(removed)
        }
      },
      { discrete: true },
    )
    expect(exports).toBe(2)
    expect(afters).toBe(2)
  },
)
