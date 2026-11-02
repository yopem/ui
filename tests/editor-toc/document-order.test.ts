import { $getEditorTocSnapshot } from "@editor/toc-state"
import { createHeadlessEditor } from "@lexical/headless"
import { createEmptyHistoryState, registerHistory } from "@lexical/history"
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text"
import { expect, test } from "bun:test"
import {
  $createTextNode,
  $getRoot,
  HISTORY_PUSH_TAG,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical"

function createTocEditor() {
  return createHeadlessEditor({
    namespace: "toc-document-order",
    nodes: [HeadingNode, QuoteNode],
    onError(error) {
      throw error
    },
  })
}

function $heading(title: string) {
  return $createHeadingNode("h2").append($createTextNode(title))
}

test("snapshot follows inserted and moved headings through undo and redo", () => {
  const editor = createTocEditor()
  const stop = registerHistory(editor, createEmptyHistoryState(), 300)
  editor.update(() => $getRoot().append($heading("First"), $heading("Last")), {
    discrete: true,
  })

  function titles() {
    return editor
      .getEditorState()
      .read(() =>
        $getEditorTocSnapshot().headings.map((heading) => heading.title),
      )
  }

  try {
    editor.update(
      () => $getRoot().getFirstChildOrThrow().insertBefore($heading("New")),
      { discrete: true, tag: HISTORY_PUSH_TAG },
    )
    expect(titles()).toEqual(["New", "First", "Last"])
    editor.update(
      () => {
        const root = $getRoot()
        root.getFirstChildOrThrow().insertBefore(root.getLastChildOrThrow())
      },
      { discrete: true, tag: HISTORY_PUSH_TAG },
    )
    expect(titles()).toEqual(["Last", "New", "First"])
    editor.dispatchCommand(UNDO_COMMAND, undefined)
    editor.update(() => undefined, { discrete: true })
    expect(titles()).toEqual(["New", "First", "Last"])
    editor.dispatchCommand(UNDO_COMMAND, undefined)
    editor.update(() => undefined, { discrete: true })
    expect(titles()).toEqual(["First", "Last"])
    editor.dispatchCommand(REDO_COMMAND, undefined)
    editor.update(() => undefined, { discrete: true })
    expect(titles()).toEqual(["New", "First", "Last"])
    editor.dispatchCommand(REDO_COMMAND, undefined)
    editor.update(() => undefined, { discrete: true })
    expect(titles()).toEqual(["Last", "New", "First"])
  } finally {
    stop()
  }
})

test("snapshot uses nested document order without changing content in read-only mode", () => {
  const editor = createTocEditor()
  editor.update(
    () => {
      const late = $heading("Nested")
      const first = $heading("First")
      const last = $heading("Last")
      $getRoot().append(first, $createQuoteNode().append(late), last)
      late.selectStart()
    },
    { discrete: true },
  )
  editor.setEditable(false)
  const before = editor.getEditorState().toJSON()
  const snapshot = editor.getEditorState().read($getEditorTocSnapshot)
  expect(snapshot.headings.map((heading) => heading.title)).toEqual([
    "First",
    "Nested",
    "Last",
  ])
  expect(snapshot.activeKey).toBe(snapshot.headings[1]?.key)
  expect(editor.isEditable()).toBe(false)
  expect(editor.getEditorState().toJSON()).toEqual(before)
})

test("snapshot caps the first 500 nonempty headings in document order", () => {
  const editor = createTocEditor()
  editor.update(
    () => {
      const root = $getRoot()

      for (let index = 0; index < 500; index += 1)
        root.append($heading(`Heading ${index}`))

      root.getFirstChildOrThrow().insertBefore($heading("New first"))
      root.getFirstChildOrThrow().insertBefore($heading("  "))
      root.getLastChildOrThrow().selectStart()
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()
  const snapshot = editor.getEditorState().read($getEditorTocSnapshot)
  expect(snapshot.headings.map((heading) => heading.title)).toEqual([
    "New first",
    ...Array.from({ length: 499 }, (_, index) => `Heading ${index}`),
  ])
  expect(snapshot.headings).toHaveLength(500)
  expect(snapshot.activeKey).toBeNull()
  expect(editor.getEditorState().toJSON()).toEqual(before)
})
