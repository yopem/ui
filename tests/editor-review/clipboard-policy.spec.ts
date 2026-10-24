import { MarkNode } from "@lexical/mark"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  createEditor,
  CUT_COMMAND,
  PASTE_COMMAND,
} from "lexical"

class ReviewPasteEvent extends Event implements InputEvent {
  data = null
  dataTransfer = null
  inputType = "insertFromPaste"
  isComposing = false
  detail = 0
  view: Window | null = null
  which = 0

  constructor() {
    super("paste", { bubbles: true, cancelable: true })
  }

  getTargetRanges(): StaticRange[] {
    return []
  }

  initUIEvent(
    type: string,
    bubbles = false,
    cancelable = false,
    view: Window | null = null,
    detail = 0,
  ) {
    this.initEvent(type, bubbles, cancelable)
    this.view = view
    this.detail = detail
  }
}

for (const priority of [
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_CRITICAL,
] as const) {
  for (const order of ["before", "after"] as const) {
    for (const operation of ["paste", "cut"] as const) {
      test(`host ${priority} ${operation} policy registered ${order} review retains control`, () => {
        const editor = createEditor({
          namespace: "review-clipboard-policy",
          nodes: [MarkNode],
          onError(error) {
            throw error
          },
        })

        let calls = 0

        function veto() {
          calls += 1

          return true
        }

        function registerPolicy() {
          return operation === "paste"
            ? editor.registerCommand(PASTE_COMMAND, veto, priority)
            : editor.registerCommand(CUT_COMMAND, veto, priority)
        }

        const before = order === "before" ? registerPolicy() : null
        const controller = createEditorReview()
        const detach = controller.register(editor)
        const after = order === "after" ? registerPolicy() : null
        const review = controller.forEditor(editor)

        try {
          review.setHost({
            viewer: { id: "alice", name: "Alice" },
            visible: true,
            replyWhileReadonly: false,
            can: () => true,
          })
          editor.update(
            () => {
              $getRoot().append(
                $createParagraphNode().append($createTextNode("Keep content")),
              )
            },
            { discrete: true },
          )
          review.setSuggesting(true)
          const original = editor.getEditorState().toJSON()

          editor.update(
            () => {
              if (operation === "paste")
                editor.dispatchCommand(PASTE_COMMAND, new ReviewPasteEvent())
              else editor.dispatchCommand(CUT_COMMAND, null)
            },
            { discrete: true },
          )
          expect(calls).toBe(1)
          expect(editor.getEditorState().toJSON()).toEqual(original)
        } finally {
          after?.()
          detach()
          before?.()
        }
      })
    }
  }
}
