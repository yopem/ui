import { $createEditorMathNode, EditorMathNode } from "@editor/math-node"
import { createEditorSelectionBookmark } from "@editor/selection-bookmark"
import { expect, test } from "bun:test"
import {
  $getRoot,
  $createNodeSelection,
  $setSelection,
  createEditor,
} from "lexical"

test("math edit revisions expire permanently after host change and restoration", () => {
  const editor = createEditor({
    namespace: "math-session",
    nodes: [EditorMathNode],
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      const node = $createEditorMathNode({ kind: "block", tex: "x^2" })
      $getRoot().append(node)
      const selection = $createNodeSelection()
      selection.add(node.getKey())
      $setSelection(selection)
    },
    { discrete: true },
  )
  const bookmark = createEditorSelectionBookmark(editor)
  const unsubscribe = bookmark.subscribe(() => undefined)
  const original = editor.getEditorState()
  const revision = bookmark.getRevision()
  original.read(bookmark.capture)
  expect(bookmark.getSnapshot()).toBe(false)
  editor.update(() => $setSelection(null), { discrete: true })
  expect(bookmark.getRevision()).toBe(revision)
  editor.update(
    () => {
      const node = $getRoot().getFirstChildOrThrow()

      if (!(node instanceof EditorMathNode)) throw new Error("Expected math")
      node.setValue({ kind: "block", tex: "y^3" })
    },
    { discrete: true },
  )
  expect(bookmark.getRevision()).toBeGreaterThan(revision)
  const changed = bookmark.getRevision()
  editor.setEditorState(original)
  expect(bookmark.getRevision()).toBeGreaterThan(changed)
  expect(bookmark.getRevision()).not.toBe(revision)
  unsubscribe()
  const stopped = bookmark.getRevision()
  const stop = bookmark.subscribe(() => undefined)
  expect(bookmark.getRevision()).toBeGreaterThan(revision)
  expect(bookmark.getRevision()).toBe(stopped)
  stop()
})
