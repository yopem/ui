import {
  $createEditorDrawingNode,
  $isEditorDrawingNode,
  EditorDrawingNode,
  registerEditorDrawingRenderer,
} from "@editor/drawing"
import { expect, test } from "bun:test"
import { $getRoot, createEditor } from "lexical"

function createDrawingEditor() {
  const editor = createEditor({
    namespace: "drawing-runtime-lifecycle",
    nodes: [EditorDrawingNode],
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      $getRoot().append($createEditorDrawingNode({ elements: [] }))
    },
    { discrete: true },
  )

  return editor
}

function readDrawing(editor: ReturnType<typeof createDrawingEditor>) {
  return editor.getEditorState().read(() => {
    const node = $getRoot().getFirstChild()

    if (!$isEditorDrawingNode(node)) throw new Error("Missing drawing fixture")

    return node.decorate(editor)
  })
}

test("drawing runtime refreshes existing nodes without changing saved content", () => {
  const editor = createDrawingEditor()
  const saved = editor.getEditorState().toJSON()

  expect(readDrawing(editor)).toBe("Drawing with 0 elements")

  const unregister = registerEditorDrawingRenderer(
    editor,
    () => "Native drawing preview",
  )

  expect(readDrawing(editor)).toBe("Native drawing preview")
  expect(editor.getEditorState().toJSON()).toEqual(saved)

  unregister()

  expect(readDrawing(editor)).toBe("Drawing with 0 elements")
  expect(editor.getEditorState().toJSON()).toEqual(saved)
})

test("drawing renderer cleanup is idempotent and cannot remove a later owner", () => {
  const editor = createDrawingEditor()

  function renderer() {
    return "Native drawing preview"
  }

  const unregisterFirst = registerEditorDrawingRenderer(editor, renderer)

  expect(() => registerEditorDrawingRenderer(editor, renderer)).toThrow()

  unregisterFirst()

  const unregisterNext = registerEditorDrawingRenderer(editor, renderer)

  unregisterFirst()

  expect(readDrawing(editor)).toBe("Native drawing preview")

  unregisterNext()
  unregisterNext()

  expect(readDrawing(editor)).toBe("Drawing with 0 elements")
})
