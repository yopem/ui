import { createEditorBlockSelection } from "@editor/block-selection"
import { GetClipboardDataExtension } from "@lexical/clipboard"
import { buildEditorFromExtensions } from "@lexical/extension"
import { RichTextExtension } from "@lexical/rich-text"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isTextNode,
  configExtension,
  COPY_COMMAND,
  CUT_COMMAND,
} from "lexical"

for (const phase of ["export", "validate", "transport"] as const) {
  test(`synchronous ${phase} content changes never delete uncopied content`, () => {
    let armed = false

    function change() {
      if (!armed) return
      armed = false
      const block = $getRoot().getFirstChildOrThrow()
      const text = $isElementNode(block) ? block.getFirstChild() : null

      if (!$isTextNode(text)) throw new Error("Missing text")
      text.setTextContent("Updated secret")
    }

    const controller = createEditorBlockSelection({
      authorizeCut: () => true,
      validateDocument() {
        if (phase === "validate") change()

        return true
      },
    })

    const editor = buildEditorFromExtensions({
      name: "test/block-selection-reentrancy",
      dependencies: [
        RichTextExtension,
        controller.extension,
        configExtension(GetClipboardDataExtension, {
          $exportMimeType: {
            "text/plain": [
              (selection) => {
                const text = selection?.getTextContent() ?? null

                if (phase === "export") change()

                return text
              },
            ],
            "text/html": [() => null],
            "application/x-lexical-editor": [() => null],
          },
        }),
      ],
    })

    editor.update(
      () => {
        $getRoot()
          .clear()
          .append(
            $createParagraphNode().append($createTextNode("Alpha")),
            $createParagraphNode().append($createTextNode("Beta")),
          )
      },
      { discrete: true },
    )
    controller.select(editor.read(() => $getRoot().getChildrenKeys()[0]))
    const values = new Map<string, string>()

    const event = Object.assign(new Event("cut", { cancelable: true }), {
      clipboardData: null,
    })

    Object.defineProperty(event, "clipboardData", {
      value: {
        setData(mime: string, value: string) {
          values.set(mime, value)

          if (phase === "transport") change()
        },
        getData(mime: string) {
          return values.get(mime) ?? ""
        },
      },
    })
    armed = true
    editor.update(
      () => {
        editor.dispatchCommand(CUT_COMMAND, event)
      },
      { discrete: true },
    )
    expect(editor.read(() => $getRoot().getChildrenSize())).toBe(2)
    expect(editor.read(() => $getRoot().getTextContent())).toContain(
      "Updated secret",
    )

    if (phase !== "transport") expect(values.size).toBe(0)
    editor.dispose()
  })
}

test("all-MIME veto prevents clipboard write and block deletion", () => {
  const controller = createEditorBlockSelection({ authorizeCut: () => true })

  const editor = buildEditorFromExtensions({
    name: "test/block-selection-veto",
    dependencies: [
      RichTextExtension,
      controller.extension,
      configExtension(GetClipboardDataExtension, {
        $exportMimeType: {
          "text/plain": [() => null],
          "text/html": [() => null],
          "application/x-lexical-editor": [() => null],
          "text/uri-list": [() => null],
        },
      }),
    ],
  })

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Alpha")))
    },
    { discrete: true },
  )
  controller.select(editor.read(() => $getRoot().getChildrenKeys()[0]))
  const before = editor.getEditorState().toJSON()
  let writes = 0

  for (const command of [COPY_COMMAND, CUT_COMMAND]) {
    const event = Object.assign(new Event("cut", { cancelable: true }), {
      clipboardData: null,
    })

    Object.defineProperty(event, "clipboardData", {
      value: {
        setData() {
          writes++
        },
        getData() {
          return ""
        },
      },
    })
    editor.update(
      () => {
        editor.dispatchCommand(command, event)
      },
      { discrete: true },
    )
  }

  expect(writes).toBe(0)
  expect(editor.getEditorState().toJSON()).toEqual(before)
  editor.dispose()
})
