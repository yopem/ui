import { createEditorBlockMenu } from "@editor/block-menu"
import { createEditorBlockSelection } from "@editor/block-selection"
import {
  CONVERT_EDITOR_BLOCK_COMMAND,
  EditorBlocksExtension,
  REMOVE_EDITOR_BLOCK_COMMAND,
} from "@editor/blocks-extension"
import {
  $createCalloutNode,
  $createToggleNode,
  $unwrapEditorBlock,
  CalloutNode,
  ToggleNode,
} from "@editor/blocks-model"
import { CodeExtension } from "@lexical/code"
import { buildEditorFromExtensions } from "@lexical/extension"
import {
  createEmptyHistoryState,
  HistoryExtension,
  registerHistory,
} from "@lexical/history"
import { $createLinkNode, LinkExtension } from "@lexical/link"
import {
  $createListItemNode,
  $createListNode,
  ListExtension,
} from "@lexical/list"
import { RichTextExtension } from "@lexical/rich-text"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSlot,
  configExtension,
  COMMAND_PRIORITY_HIGH,
  HISTORY_PUSH_TAG,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical"

function selection() {
  const value = $getSelection()

  if (!$isRangeSelection(value)) return value?.clone() ?? null

  return [
    value.anchor.key,
    value.anchor.offset,
    value.anchor.type,
    value.focus.key,
    value.focus.offset,
    value.focus.type,
  ]
}

for (const kind of ["callout", "toggle"] as const) {
  for (const owner of ["block", "summary", "body", "direct"] as const) {
    if (kind === "callout" && (owner === "summary" || owner === "body"))
      continue

    for (const action of ["convert", "unwrap"] as const) {
      test(`${action} rejects ${kind} ${owner} slots without changing document, selection or history`, async () => {
        const editor = buildEditorFromExtensions({
          name: "test/block-slots",
          dependencies: [RichTextExtension, EditorBlocksExtension],
        })

        const history = createEmptyHistoryState()
        const unregisterHistory = registerHistory(editor, history, 300)
        editor.update(
          () => {
            $getRoot().clear()

            const block =
              kind === "callout"
                ? $createCalloutNode().append(
                    $createParagraphNode().append($createTextNode("body")),
                  )
                : $createToggleNode()

            if (block instanceof ToggleNode) {
              block.getSummary().append($createTextNode("title"))
              block
                .getBody()
                .append($createParagraphNode().append($createTextNode("body")))
            }

            if (owner === "direct") {
              $getRoot().append(
                $createParagraphNode().append($createTextNode("sibling")),
              )
              $setSlot($getRoot(), "direct", block)
            } else {
              $getRoot().append(block)

              const host =
                block instanceof ToggleNode && owner === "summary"
                  ? block.getSummary()
                  : block instanceof ToggleNode && owner === "body"
                    ? block.getBody()
                    : block

              $setSlot(
                host,
                "private",
                $createParagraphNode().append($createTextNode("private data")),
              )
            }

            block.selectStart()
          },
          { discrete: true },
        )
        const prior = editor.getEditorState().toJSON()
        editor.update(
          () =>
            $getRoot().append(
              $createParagraphNode().append($createTextNode("history")),
            ),
          { discrete: true, tag: HISTORY_PUSH_TAG },
        )
        const before = editor.getEditorState().toJSON()

        const beforeHistory = [
          history.undoStack.length,
          history.redoStack.length,
        ]

        expect(history.undoStack.length).toBeGreaterThan(0)

        const beforeSelection = editor.read(selection)
        let handled = true
        editor.update(
          () => {
            if (action === "unwrap") {
              const selected = $getSelection()

              if (!$isRangeSelection(selected)) throw new Error("Missing range")
              let node = selected.anchor.getNode()

              while (
                !(node instanceof CalloutNode || node instanceof ToggleNode)
              )
                node = node.getParentOrThrow()
              handled = $unwrapEditorBlock(node) === true
            } else
              handled = editor.dispatchCommand(
                CONVERT_EDITOR_BLOCK_COMMAND,
                kind === "callout" ? "toggle" : "callout",
              )
          },
          { discrete: true },
        )
        expect(handled).toBe(false)
        expect(editor.getEditorState().toJSON()).toEqual(before)
        expect(editor.read(selection)).toEqual(beforeSelection)
        expect([history.undoStack.length, history.redoStack.length]).toEqual(
          beforeHistory,
        )
        editor.dispatchCommand(UNDO_COMMAND, undefined)
        await Promise.resolve()
        expect(editor.getEditorState().toJSON()).toEqual(prior)
        editor.dispatchCommand(REDO_COMMAND, undefined)
        await Promise.resolve()
        expect(editor.getEditorState().toJSON()).toEqual(before)
        unregisterHistory()
        editor.dispose()
      })
    }
  }
}

test("conversion and unwrap preserve slots on descendants that remain attached", () => {
  for (const action of ["convert", "unwrap"] as const) {
    const editor = buildEditorFromExtensions({
      name: "test/retained-slot",
      dependencies: [RichTextExtension, EditorBlocksExtension],
    })

    editor.update(
      () => {
        const child = $createParagraphNode().append($createTextNode("body"))
        $setSlot(
          child,
          "kept",
          $createParagraphNode().append($createTextNode("private")),
        )
        $getRoot().append($createCalloutNode().append(child))
        child.selectStart()
      },
      { discrete: true },
    )
    editor.update(
      () => {
        if (action === "convert")
          expect(
            editor.dispatchCommand(CONVERT_EDITOR_BLOCK_COMMAND, "toggle"),
          ).toBe(true)
        else
          expect(
            editor.dispatchCommand(REMOVE_EDITOR_BLOCK_COMMAND, undefined),
          ).toBe(true)
      },
      { discrete: true },
    )
    expect(JSON.stringify(editor.getEditorState().toJSON())).toContain(
      "private",
    )
    editor.dispose()
  }
})

test("block delete rejects slots on target or descendants before document validation", () => {
  for (const location of ["target", "descendant"] as const) {
    let validations = 0

    const controller = createEditorBlockSelection({
      validateDocument() {
        validations++

        return true
      },
    })

    const editor = buildEditorFromExtensions({
      name: "test/block-delete-slots",
      dependencies: [
        RichTextExtension,
        configExtension(HistoryExtension, { disabled: false }),
        EditorBlocksExtension,
        controller.extension,
      ],
    })

    editor.update(
      () => {
        const child = $createParagraphNode().append($createTextNode("body"))
        const block = $createCalloutNode().append(child)
        $setSlot(
          location === "target" ? block : child,
          "private",
          $createParagraphNode().append($createTextNode("private")),
        )
        $getRoot().clear().append(block, $createParagraphNode())
      },
      { discrete: true },
    )
    const key = editor.read(() => $getRoot().getFirstChildOrThrow().getKey())
    controller.select(key)
    const before = editor.getEditorState().toJSON()
    const selected = editor.read(() => $getSelection()?.clone())
    expect(controller.remove()).toBe(false)
    expect(validations).toBe(0)
    expect(editor.getEditorState().toJSON()).toEqual(before)
    expect(editor.read(() => selected?.is($getSelection()))).toBe(true)
    editor.dispose()
  }
})

test("menu conversion and delete reject slotted targets without moving selection", async () => {
  for (const action of ["heading-2", "delete"] as const) {
    const controller = createEditorBlockMenu()

    const editor = buildEditorFromExtensions({
      name: "test/menu-slots",
      dependencies: [
        RichTextExtension,
        ListExtension,
        CodeExtension,
        controller.extension,
      ],
    })

    editor.update(
      () => {
        const block = $createParagraphNode().append($createTextNode("body"))
        $setSlot(
          block,
          "private",
          $createParagraphNode().append($createTextNode("private")),
        )
        $getRoot().append(block, $createParagraphNode())
        block.selectStart()
      },
      { discrete: true },
    )
    expect(controller.captureFromSelection()).toBe(true)
    const before = editor.getEditorState().toJSON()
    const beforeSelection = editor.read(selection)
    expect(await controller.run(action)).toBe(false)
    expect(editor.getEditorState().toJSON()).toEqual(before)
    expect(editor.read(selection)).toEqual(beforeSelection)
    editor.dispose()
  }
})

test("menu list conversion rejects discarded list item slots and preserves moved descendants", async () => {
  for (const owner of ["item", "link"] as const) {
    const controller = createEditorBlockMenu()

    const editor = buildEditorFromExtensions({
      name: "test/list-slot",
      dependencies: [
        RichTextExtension,
        ListExtension,
        LinkExtension,
        CodeExtension,
        controller.extension,
      ],
    })

    editor.update(
      () => {
        const text = $createTextNode("body")
        const link = $createLinkNode("https://example.com").append(text)
        const item = $createListItemNode().append(link)
        $setSlot(
          owner === "item" ? item : link,
          "private",
          $createParagraphNode().append($createTextNode("private")),
        )
        $getRoot().clear().append($createListNode("bullet").append(item))
        text.select()
      },
      { discrete: true },
    )
    expect(controller.captureFromSelection()).toBe(true)
    const before = editor.getEditorState().toJSON()
    const beforeSelection = editor.read(selection)
    expect(await controller.run("heading-2")).toBe(owner === "link")

    if (owner === "item") {
      expect(editor.getEditorState().toJSON()).toEqual(before)
      expect(editor.read(selection)).toEqual(beforeSelection)
    } else
      expect(JSON.stringify(editor.getEditorState().toJSON())).toContain(
        "private",
      )
    editor.dispose()
  }
})

test("higher-priority host command handlers retain cancellation", () => {
  const editor = buildEditorFromExtensions({
    name: "test/host-block-cancel",
    dependencies: [RichTextExtension, EditorBlocksExtension],
  })

  editor.update(
    () => {
      const block = $createCalloutNode().append(
        $createParagraphNode().append($createTextNode("body")),
      )

      $getRoot().clear().append(block)
      block.selectStart()
    },
    { discrete: true },
  )
  let calls = 0

  const stop = editor.registerCommand(
    CONVERT_EDITOR_BLOCK_COMMAND,
    () => {
      calls++

      return true
    },
    COMMAND_PRIORITY_HIGH,
  )

  const before = editor.getEditorState().toJSON()
  editor.update(
    () =>
      expect(
        editor.dispatchCommand(CONVERT_EDITOR_BLOCK_COMMAND, "toggle"),
      ).toBe(true),
    { discrete: true },
  )
  expect(calls).toBe(1)
  expect(editor.getEditorState().toJSON()).toEqual(before)
  stop()
  editor.dispose()
})

test("ordinary conversion, unwrap and delete remain available; read-only blocks commands", () => {
  const editor = buildEditorFromExtensions({
    name: "test/ordinary-blocks",
    dependencies: [RichTextExtension, EditorBlocksExtension],
  })

  editor.update(
    () => {
      const block = $createCalloutNode().append(
        $createParagraphNode().append($createTextNode("body")),
      )

      $getRoot().append(block)
      block.selectStart()
    },
    { discrete: true },
  )
  editor.setEditable(false)
  editor.update(
    () =>
      expect(
        editor.dispatchCommand(CONVERT_EDITOR_BLOCK_COMMAND, "toggle"),
      ).toBe(false),
    { discrete: true },
  )
  editor.setEditable(true)
  editor.update(
    () =>
      expect(
        editor.dispatchCommand(CONVERT_EDITOR_BLOCK_COMMAND, "toggle"),
      ).toBe(true),
    { discrete: true },
  )
  editor.update(
    () =>
      expect(
        editor.dispatchCommand(REMOVE_EDITOR_BLOCK_COMMAND, undefined),
      ).toBe(true),
    { discrete: true },
  )
  expect(editor.read(() => $getRoot().getTextContent())).toContain("body")
  editor.dispose()
})
