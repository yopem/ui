import {
  EditorEditableCardNode,
  registerEditorEditableCardRenderer,
} from "@editor/editable-card-node"
import { expect, test } from "bun:test"
import { $getRoot, createEditor } from "lexical"

test("editable card renderers stay editor-local and clean up by identity", () => {
  const firstEditor = createEditor({ nodes: [EditorEditableCardNode] })

  const secondEditor = createEditor({ nodes: [EditorEditableCardNode] })

  firstEditor.update(
    () => {
      $getRoot().append(new EditorEditableCardNode())
    },
    { discrete: true },
  )

  const node = firstEditor.read(() => {
    const card = $getRoot().getFirstChildOrThrow()

    if (!(card instanceof EditorEditableCardNode))
      throw new Error("Expected editable card")

    return card
  })

  const removeFirst = registerEditorEditableCardRenderer(
    firstEditor,
    () => "first editor",
  )

  const removeSecond = registerEditorEditableCardRenderer(
    secondEditor,
    () => "second editor",
  )

  expect(node.decorate(firstEditor)).toBe("first editor")
  expect(node.decorate(secondEditor)).toBe("second editor")
  expect(() =>
    registerEditorEditableCardRenderer(firstEditor, () => "duplicate"),
  ).toThrow()

  removeFirst()

  const removeReplacement = registerEditorEditableCardRenderer(
    firstEditor,
    () => "replacement editor",
  )

  removeFirst()

  expect(node.decorate(firstEditor)).toBe("replacement editor")
  expect(node.decorate(secondEditor)).toBe("second editor")

  removeReplacement()
  removeSecond()

  expect(node.decorate(firstEditor)).toBeNull()
  expect(node.decorate(secondEditor)).toBeNull()
})
