import { registerEditorClipboardGuard } from "@editor/clipboard-guard"
import { $insertGeneratedNodes } from "@lexical/clipboard"
import { describe, expect, test } from "bun:test"
import {
  $createNodeSelection,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  createEditor,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
} from "lexical"

function setup() {
  const editor = createEditor({
    namespace: "clipboard-guard-test",
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      $getRoot().append(
        $createParagraphNode().append($createTextNode("Keep content")),
      )
    },
    { discrete: true },
  )

  return { editor, dispose: registerEditorClipboardGuard(editor) }
}

describe("empty clipboard insertion guard", () => {
  test("keeps a selected block when HTML produces no nodes", () => {
    const { editor, dispose } = setup()
    const before = editor.getEditorState().toJSON()

    editor.update(
      () => {
        const selection = $createNodeSelection()
        selection.add($getRoot().getFirstChildOrThrow().getKey())
        $setSelection(selection)
        $insertGeneratedNodes(editor, [], selection)
      },
      { discrete: true },
    )

    expect(editor.getEditorState().toJSON()).toEqual(before)
    dispose()
  })

  test("keeps selected text when HTML produces no nodes", () => {
    const { editor, dispose } = setup()
    const before = editor.getEditorState().toJSON()

    editor.update(
      () => {
        const selection = $getRoot().select(0, 1)
        $insertGeneratedNodes(editor, [], selection)
      },
      { discrete: true },
    )

    expect(editor.getEditorState().toJSON()).toEqual(before)
    dispose()
  })

  test("leaves nonempty native clipboard insertion unchanged", () => {
    const { editor, dispose } = setup()

    editor.update(
      () => {
        const selection = $createNodeSelection()
        selection.add($getRoot().getFirstChildOrThrow().getKey())
        $setSelection(selection)
        $insertGeneratedNodes(
          editor,
          [$createParagraphNode().append($createTextNode("Replacement"))],
          selection,
        )
      },
      { discrete: true },
    )

    expect(
      editor.getEditorState().read(() => $getRoot().getTextContent()),
    ).toBe("Replacement")
    dispose()
  })

  test("preserves higher-priority host clipboard policy", () => {
    const { editor, dispose } = setup()
    const before = editor.getEditorState().toJSON()

    let calls = 0

    const stopHost = editor.registerCommand(
      SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
      () => {
        calls += 1

        return true
      },
      COMMAND_PRIORITY_HIGH,
    )

    editor.update(
      () => {
        const selection = $getRoot().select(0, 1)
        $insertGeneratedNodes(editor, [$createTextNode("Denied")], selection)
      },
      { discrete: true },
    )

    expect(calls).toBe(1)
    expect(editor.getEditorState().toJSON()).toEqual(before)
    stopHost()
    dispose()
  })

  test("unregisters its command listener", () => {
    const { editor, dispose } = setup()
    dispose()
    let handled = true

    editor.update(
      () => {
        handled = editor.dispatchCommand(
          SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
          {
            nodes: [],
            selection: $getRoot().select(0, 1),
          },
        )
      },
      { discrete: true },
    )

    expect(handled).toBe(false)
  })
})
