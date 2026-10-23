import { createEditorTableBookmark } from "@editor/table-bookmark"
import {
  $createTableNodeWithDimensions,
  $createTableSelection,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  $isTableSelection,
  $mergeCells,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table"
import { describe, expect, test } from "bun:test"
import {
  $createNodeSelection,
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  createEditor,
} from "lexical"

function setup(native = false) {
  const editor = createEditor({
    namespace: "table-bookmark-test",
    nodes: [TableNode, TableRowNode, TableCellNode],
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      const table = $createTableNodeWithDimensions(2, 2)
      $getRoot().append(table)

      for (const cell of cells()) {
        cell
          .clear()
          .append(
            $createParagraphNode().append($createTextNode("original text")),
          )
      }

      if (native) {
        const selection = $createTableSelection()
        selection.set(table.getKey(), cells()[0].getKey(), cells()[3].getKey())
        $setSelection(selection)
      } else text().select(1, 5)
    },
    { discrete: true },
  )
  const bookmark = createEditorTableBookmark(editor)

  return { editor, bookmark }
}

function cells() {
  const table = $getRoot().getFirstChildOrThrow()

  if (!$isTableNode(table)) throw new Error("Expected table")

  return table.getChildren().flatMap((row) => {
    if (!$isTableRowNode(row)) throw new Error("Expected row")

    return row.getChildren().map((cell) => {
      if (!$isTableCellNode(cell)) throw new Error("Expected cell")

      return cell
    })
  })
}

function text() {
  const node = cells()[0].getFirstDescendant()

  if (!$isTextNode(node)) throw new Error("Expected text")

  return node
}

function unrelated() {
  const current = $createRangeSelection()
  current.anchor.set("root", 0, "element")
  current.focus.set("root", 0, "element")
  $setSelection(current)

  return current
}

describe("table bookmark", () => {
  test.each([false, true])(
    "restores independent clones; native=%s",
    (native) => {
      const { editor, bookmark } = setup(native)
      const stop = bookmark.subscribe(() => undefined)
      editor.getEditorState().read(bookmark.capture)
      expect(bookmark.getSnapshot()).toBe(true)
      expect(bookmark.getServerSnapshot()).toBe(false)
      editor.update(
        () => {
          unrelated()
          expect(bookmark.restore()).toBe(true)
          const first = $getSelection()

          if (!$isRangeSelection(first) && !$isTableSelection(first))
            throw new Error("Expected selection")
          const anchorKey = first.anchor.key
          const focusKey = first.focus.key
          const anchorOffset = first.anchor.offset
          const focusOffset = first.focus.offset
          first.anchor.offset = 0
          first.focus.key = anchorKey
          expect(
            native ? $isTableSelection(first) : $isRangeSelection(first),
          ).toBe(true)
          expect(bookmark.restore()).toBe(true)
          const restored = $getSelection()
          expect(restored).not.toBe(first)

          if (!$isRangeSelection(restored) && !$isTableSelection(restored))
            throw new Error("Expected restored selection")
          expect(restored.anchor.offset).toBe(anchorOffset)
          expect(restored.focus.key).toBe(focusKey)
          expect(restored.focus.offset).toBe(focusOffset)
        },
        { discrete: true },
      )
      bookmark.clear()
      expect(bookmark.getSnapshot()).toBe(false)
      stop()
    },
  )

  test.each(["text", "format", "replace", "delete", "merge"])(
    "%s mutation invalidates and notifies",
    (kind) => {
      const { editor, bookmark } = setup(true)
      let notifications = 0

      const stop = bookmark.subscribe(() => {
        notifications += 1
      })

      editor.getEditorState().read(bookmark.capture)
      editor.update(
        () => {
          if (kind === "text") text().setTextContent("x")

          if (kind === "format") text().toggleFormat("bold")

          if (kind === "delete") cells()[0].remove()

          if (kind === "merge") $mergeCells(cells())

          if (kind === "replace") {
            $getRoot()
              .clear()
              .append(
                $createParagraphNode().append($createTextNode("replacement")),
              )
            $getRoot().selectEnd()
          }
        },
        { discrete: true },
      )
      expect(bookmark.getSnapshot()).toBe(false)
      expect(notifications).toBe(2)
      editor.update(
        () => {
          const current = unrelated()
          expect(bookmark.restore()).toBe(false)
          expect($getSelection()).toBe(current)
        },
        { discrete: true },
      )
      stop()
    },
  )

  test.each([
    "missing",
    "negative",
    "fractional",
    "nonfinite",
    "text-type",
    "element-type",
    "shortened",
    "detached",
    "different-table",
    "table-key",
    "table-point",
    "table-offset",
    "element-offset",
  ])("rejects %s without replacing unrelated selection", (kind) => {
    const native = kind.startsWith("table-")
    const { editor, bookmark } = setup(native)
    const stop = bookmark.subscribe(() => undefined)
    editor.update(
      () => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection) && !$isTableSelection(selection))
          throw new Error("Expected selection")

        if (kind === "missing") selection.anchor.key = "missing"

        if (kind === "negative") selection.anchor.offset = -1

        if (kind === "fractional") selection.focus.offset = 1.5

        if (kind === "nonfinite") selection.focus.offset = Number.NaN

        if (kind === "text-type") selection.anchor.key = cells()[0].getKey()

        if (kind === "element-type") selection.focus.type = "element"

        if (kind === "element-offset") {
          selection.anchor.set(cells()[0].getKey(), 99, "element")
        }

        if ($isTableSelection(selection)) {
          if (kind === "table-key") selection.tableKey = cells()[0].getKey()

          if (kind === "table-point") selection.anchor.key = text().getKey()

          if (kind === "table-offset") selection.focus.offset = 1
        }

        if (kind === "different-table") {
          const other = $createTableNodeWithDimensions(1, 1)
          $getRoot().append(other)
          const row = other.getFirstChildOrThrow()

          if (!$isTableRowNode(row)) throw new Error("Expected row")
          const cell = row.getFirstChildOrThrow()

          if (!$isTableCellNode(cell)) throw new Error("Expected cell")
          const otherText = $createTextNode("other table")
          cell.clear().append($createParagraphNode().append(otherText))
          selection.focus.set(otherText.getKey(), 0, "text")
        }

        bookmark.capture()

        if (kind === "shortened") text().setTextContent("x")

        if (kind === "detached") cells()[0].remove()
        const current = unrelated()
        expect(bookmark.restore()).toBe(false)
        expect($getSelection()).toBe(current)
        expect(bookmark.getSnapshot()).toBe(false)
      },
      { discrete: true },
    )
    stop()
  })

  test.each([false, true])(
    "same-key document replacement clears; native=%s",
    (native) => {
      const { editor, bookmark } = setup(native)
      const stop = bookmark.subscribe(() => undefined)
      const replacement = editor.getEditorState().clone(null)
      editor.getEditorState().read(bookmark.capture)
      editor.setEditorState(replacement)
      expect(bookmark.getSnapshot()).toBe(false)
      editor.update(
        () => {
          const current = unrelated()
          expect(bookmark.restore()).toBe(false)
          expect($getSelection()).toBe(current)
        },
        { discrete: true },
      )
      stop()
    },
  )

  test("mutation outside selected table clears", () => {
    const { editor, bookmark } = setup()
    const stop = bookmark.subscribe(() => undefined)
    editor.getEditorState().read(bookmark.capture)
    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append($createTextNode("elsewhere")),
        )
      },
      { discrete: true },
    )
    expect(bookmark.getSnapshot()).toBe(false)
    stop()
  })

  test.each(["null", "node", "outside"])(
    "%s capture clears previous bookmark",
    (kind) => {
      const { editor, bookmark } = setup()
      const stop = bookmark.subscribe(() => undefined)
      editor.getEditorState().read(bookmark.capture)
      editor.update(
        () => {
          if (kind === "null") $setSelection(null)

          if (kind === "node") {
            const selection = $createNodeSelection()
            selection.add(cells()[0].getKey())
            $setSelection(selection)
          }

          if (kind === "outside") unrelated()
          bookmark.capture()
          const current = $getSelection()
          expect(bookmark.restore()).toBe(false)
          expect($getSelection()).toBe(current)
          expect(bookmark.getSnapshot()).toBe(false)
        },
        { discrete: true },
      )
      stop()
    },
  )

  test("element range recapture replaces saved clone", () => {
    const { editor, bookmark } = setup()
    const stop = bookmark.subscribe(() => undefined)
    editor.getEditorState().read(bookmark.capture)
    editor.update(
      () => {
        cells()[0].select(0, 1)
        bookmark.capture()
        const live = $getSelection()

        if (!$isRangeSelection(live)) throw new Error("Expected range")
        live.focus.offset = 0
        unrelated()
        expect(bookmark.restore()).toBe(true)
        const restored = $getSelection()

        if (!$isRangeSelection(restored)) throw new Error("Expected range")
        expect(restored.anchor.type).toBe("element")
        expect(restored.focus.offset).toBe(1)
      },
      { discrete: true },
    )
    stop()
  })

  test("read-context restore is rejected; bound editor update can restore", () => {
    const { editor, bookmark } = setup()
    const stop = bookmark.subscribe(() => undefined)
    editor.getEditorState().read(bookmark.capture)
    editor.getEditorState().read(() => {
      const current = $getSelection()
      expect(bookmark.restore()).toBe(false)
      expect($getSelection()).toBe(current)
    })
    editor.update(
      () => {
        unrelated()
        expect(bookmark.restore()).toBe(true)
      },
      { discrete: true },
    )
    stop()
  })

  test("foreign editor update cannot restore saved selection", () => {
    const { editor, bookmark } = setup()
    const { editor: other } = setup()
    const stop = bookmark.subscribe(() => undefined)
    editor.getEditorState().read(bookmark.capture)
    other.update(
      () => {
        const current = $getSelection()
        expect(bookmark.restore()).toBe(false)
        expect($getSelection()).toBe(current)
      },
      { discrete: true },
    )
    stop()
  })

  test("native endpoints in different tables are rejected", () => {
    const { editor, bookmark } = setup(true)
    const stop = bookmark.subscribe(() => undefined)
    editor.update(
      () => {
        const other = $createTableNodeWithDimensions(1, 1)
        $getRoot().append(other)
        const row = other.getFirstChildOrThrow()

        if (!$isTableRowNode(row)) throw new Error("Expected row")
        const cell = row.getFirstChildOrThrow()
        const selection = $getSelection()

        if (!$isTableSelection(selection))
          throw new Error("Expected table selection")
        selection.focus.set(cell.getKey(), 0, "element")
        bookmark.capture()
        const current = unrelated()
        expect(bookmark.restore()).toBe(false)
        expect($getSelection()).toBe(current)
      },
      { discrete: true },
    )
    stop()
  })

  test("selection-only updates survive; readonly transition permanently clears", () => {
    const { editor, bookmark } = setup()
    let notifications = 0

    const stop = bookmark.subscribe(() => {
      notifications += 1
    })

    editor.getEditorState().read(bookmark.capture)
    editor.update(unrelated, { discrete: true })
    expect(bookmark.getSnapshot()).toBe(true)
    expect(notifications).toBe(1)
    editor.setEditable(false)
    expect(bookmark.getSnapshot()).toBe(false)
    expect(notifications).toBe(2)
    editor.getEditorState().read(bookmark.capture)
    editor.setEditable(true)
    editor.update(
      () => {
        const current = $getSelection()
        expect(bookmark.restore()).toBe(false)
        expect($getSelection()).toBe(current)
      },
      { discrete: true },
    )
    stop()
  })

  test("last unsubscribe clears and removes both listeners; remount cannot resurrect", () => {
    const { editor, bookmark } = setup()
    editor.getEditorState().read(bookmark.capture)
    expect(bookmark.getSnapshot()).toBe(false)
    let notifications = 0

    const first = bookmark.subscribe(() => {
      notifications += 1
    })

    const second = bookmark.subscribe(() => {
      notifications += 1
    })

    editor.getEditorState().read(bookmark.capture)
    first()
    editor.update(unrelated, { discrete: true })
    expect(bookmark.getSnapshot()).toBe(true)
    second()
    expect(bookmark.getSnapshot()).toBe(false)
    editor.setEditable(false)
    editor.setEditable(true)
    editor.getEditorState().read(bookmark.capture)
    expect(notifications).toBe(2)
    const stop = bookmark.subscribe(() => undefined)
    editor.update(
      () => {
        const current = $getSelection()
        expect(bookmark.restore()).toBe(false)
        expect($getSelection()).toBe(current)
      },
      { discrete: true },
    )
    stop()
  })
})
