import {
  $getPeerDependency,
  buildEditorFromExtensions,
} from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import { RichTextExtension } from "@lexical/rich-text"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  COMMAND_PRIORITY_CRITICAL,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  DELETE_LINE_COMMAND,
  DELETE_WORD_COMMAND,
  HISTORY_PUSH_TAG,
  mergeRegister,
  REDO_COMMAND,
  UNDO_COMMAND,
  configExtension,
  defineExtension,
  type LexicalEditor,
} from "lexical"
import { parseHTML } from "linkedom"
import { z } from "zod"

function makeEditor(name: string) {
  const controller = createEditorReview()

  const editor = buildEditorFromExtensions(
    defineExtension({
      name,
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        RichTextExtension,
        controller.extension,
      ],
      onError(error) {
        throw error
      },
    }),
  )

  const review = controller.forEditor(editor)

  setHost(review)

  return { editor, review }
}

function setHost(
  review: ReturnType<typeof makeEditor>["review"],
  can: (action: string) => boolean = () => true,
) {
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: (action) => can(action),
  })
}

function historyDepth(editor: LexicalEditor) {
  return editor.read(
    () =>
      $getPeerDependency<typeof HistoryExtension>(HistoryExtension.name)?.output
        .historyState.value.undoStack.length ?? -1,
  )
}

function textContent(editor: LexicalEditor) {
  return editor.read(() => $getRoot().getTextContent())
}

function selectText(
  editor: LexicalEditor,
  text: string,
  start: number,
  end: number,
) {
  editor.update(
    () => {
      const node = $createTextNode(text)
      $getRoot().clear().append($createParagraphNode().append(node))
      node.select(start, end)
    },
    { discrete: true, tag: HISTORY_PUSH_TAG },
  )
}

test("controlled native insertion replaces selected Unicode text and resolves", () => {
  const removedText = "café 🧑🏽‍🚀  slowly"
  const insertedText = "fast 🌠 words"

  for (const action of ["accept", "reject"] as const) {
    const { editor, review } = makeEditor(`review-native-input-${action}`)
    const original = `Keep ${removedText} now`
    const start = original.indexOf(removedText)

    selectText(editor, original, start, start + removedText.length)
    review.setSuggesting(true)
    expect(review.getView().suggesting).toBe(true)

    let handled = false
    editor.update(
      () => {
        handled = editor.dispatchCommand(
          CONTROLLED_TEXT_INSERTION_COMMAND,
          insertedText,
        )
      },
      { discrete: true },
    )
    expect(handled).toBe(true)

    const [suggestion] = review.getView().suggestions

    expect(review.getView().suggestions).toHaveLength(1)
    expect(suggestion?.kind).toBe("replace")
    expect(suggestion?.removedText).toBe(removedText)
    expect(suggestion?.insertedText).toBe(insertedText)
    expect(review.run(() => review.$decide(suggestion.id, action))).toBe(true)
    expect(textContent(editor)).toBe(
      action === "accept"
        ? original.replace(removedText, insertedText)
        : original,
    )
    editor.dispose()
  }
})

test("controlled replacement is one undo and redo history unit", () => {
  const { editor, review } = makeEditor("review-native-input-history")
  const original = "Start old text end"
  const start = original.indexOf("old text")

  selectText(editor, original, start, start + "old text".length)
  review.setSuggesting(true)
  expect(review.getView().suggesting).toBe(true)
  const historyBefore = historyDepth(editor)

  editor.update(
    () => {
      expect(
        editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, "new words"),
      ).toBe(true)
    },
    { discrete: true },
  )
  expect(historyDepth(editor)).toBe(historyBefore + 1)
  expect(review.getView().suggestions).toHaveLength(1)

  editor.dispatchCommand(UNDO_COMMAND, undefined)
  expect(textContent(editor)).toBe(original)
  expect(review.getView().suggestions).toHaveLength(0)

  editor.dispatchCommand(REDO_COMMAND, undefined)
  expect(textContent(editor)).toContain("old textnew words")
  expect(review.getView().suggestions).toHaveLength(1)
  editor.dispose()
})

test("controlled replacement rejects denied, readonly, and reentrant authorization", () => {
  const denied = makeEditor("review-native-input-denied")
  let deny = false

  setHost(denied.review, (action) => action !== "suggest" || !deny)
  selectText(denied.editor, "Keep selected text", 5, 16)
  denied.review.setSuggesting(true)
  deny = true
  const deniedBefore = JSON.stringify(denied.editor.getEditorState().toJSON())
  const deniedHistory = historyDepth(denied.editor)

  denied.editor.update(
    () => {
      denied.editor.dispatchCommand(
        CONTROLLED_TEXT_INSERTION_COMMAND,
        "replacement",
      )
    },
    { discrete: true },
  )
  expect(JSON.stringify(denied.editor.getEditorState().toJSON())).toBe(
    deniedBefore,
  )
  expect(historyDepth(denied.editor)).toBe(deniedHistory)
  denied.editor.dispose()

  const readonly = makeEditor("review-native-input-readonly")
  selectText(readonly.editor, "Keep selected text", 5, 16)
  readonly.review.setSuggesting(true)
  readonly.editor.setEditable(false)

  const readonlyBefore = JSON.stringify(
    readonly.editor.getEditorState().toJSON(),
  )

  readonly.editor.update(
    () => {
      readonly.editor.dispatchCommand(
        CONTROLLED_TEXT_INSERTION_COMMAND,
        "replacement",
      )
    },
    { discrete: true },
  )
  expect(JSON.stringify(readonly.editor.getEditorState().toJSON())).toBe(
    readonlyBefore,
  )
  expect(readonly.review.getView().suggestions).toHaveLength(0)
  readonly.editor.dispose()

  const reentrant = makeEditor("review-native-input-reentrant")
  let revokeMode = false

  setHost(reentrant.review, (action) => {
    if (revokeMode && action === "suggest")
      reentrant.review.setSuggesting(false)

    return true
  })
  selectText(reentrant.editor, "Keep selected text", 5, 16)
  reentrant.review.setSuggesting(true)

  const reentrantBefore = JSON.stringify(
    reentrant.editor.getEditorState().toJSON(),
  )

  const reentrantHistory = historyDepth(reentrant.editor)
  revokeMode = true

  reentrant.editor.update(
    () => {
      reentrant.editor.dispatchCommand(
        CONTROLLED_TEXT_INSERTION_COMMAND,
        "replacement",
      )
    },
    { discrete: true },
  )
  expect(reentrant.review.getView().suggesting).toBe(false)
  expect(JSON.stringify(reentrant.editor.getEditorState().toJSON())).toBe(
    reentrantBefore,
  )
  expect(historyDepth(reentrant.editor)).toBe(reentrantHistory)
  expect(reentrant.review.getView().suggestions).toHaveLength(0)
  reentrant.editor.dispose()
})

test("controlled replacement rejects marked, token, comment, and structural targets", () => {
  for (const target of ["marked", "token", "comment", "structure"] as const) {
    const { editor, review } = makeEditor(
      `review-native-input-target-${target}`,
    )

    editor.update(
      () => {
        if (target === "structure") {
          const first = $createTextNode("First block")
          const second = $createTextNode("Second block")
          $getRoot()
            .clear()
            .append(
              $createParagraphNode().append(first),
              $createParagraphNode().append(second),
            )
          const selection = first.select(2, 2)
          selection.focus.set(second.getKey(), 5, "text")
        } else {
          const text = $createTextNode(target === "token" ? "Token" : "Target")

          if (target === "token") text.setMode("token")
          $getRoot().clear().append($createParagraphNode().append(text))
          text.select(0, text.getTextContentSize())

          if (target === "marked") {
            review.$suggestDelete()
            text.select(0, text.getTextContentSize())
          } else if (target === "comment") {
            review.$createThread("Keep this comment")
            $getRoot()
              .getAllTextNodes()[0]
              ?.select(0, text.getTextContentSize())
          }
        }
      },
      { discrete: true },
    )
    review.setSuggesting(true)
    const before = JSON.stringify(editor.getEditorState().toJSON())

    editor.update(
      () => {
        editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, "replacement")
      },
      { discrete: true },
    )
    expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
    editor.dispose()
  }
})

test("native beforeinput routes insertText and word or line deletes", () => {
  const previous = new Map(
    [
      "window",
      "document",
      "HTMLElement",
      "Element",
      "Node",
      "Event",
      "InputEvent",
      "MutationObserver",
      "getComputedStyle",
    ].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  )

  const { window, document } = parseHTML(
    '<!doctype html><html><body><div id="editor"></div></body></html>',
  )

  for (const [key, value] of Object.entries({
    window,
    document,
    HTMLElement: window.HTMLElement,
    Element: window.Element,
    Node: window.Node,
    Event: window.Event,
    InputEvent: window.InputEvent,
    MutationObserver: window.MutationObserver,
    getComputedStyle: () => ({ display: "block", getPropertyValue: () => "" }),
  }))
    Object.defineProperty(globalThis, key, { configurable: true, value })

  const controller = createEditorReview()
  const textSchema = z.string()

  const observed: (
    | { command: "text"; value: string }
    | { command: "word" | "line"; backward: boolean }
  )[] = []

  const routeProbe = defineExtension({
    name: "review-native-input-route-probe",
    register(editor) {
      return mergeRegister(
        editor.registerCommand(
          CONTROLLED_TEXT_INSERTION_COMMAND,
          (payload) => {
            observed.push({ command: "text", value: textSchema.parse(payload) })

            return true
          },
          COMMAND_PRIORITY_CRITICAL,
        ),
        editor.registerCommand(
          DELETE_WORD_COMMAND,
          (backward) => {
            observed.push({ command: "word", backward })

            return true
          },
          COMMAND_PRIORITY_CRITICAL,
        ),
        editor.registerCommand(
          DELETE_LINE_COMMAND,
          (backward) => {
            observed.push({ command: "line", backward })

            return true
          },
          COMMAND_PRIORITY_CRITICAL,
        ),
      )
    },
  })

  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "review-native-input-beforeinput",
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        RichTextExtension,
        routeProbe,
        controller.extension,
      ],
      onError(error) {
        throw error
      },
    }),
  )

  const review = controller.forEditor(editor)
  const root = document.getElementById("editor")

  if (!root) throw new Error("Missing editor root.")

  let veto = false
  let propagated = 0
  root.addEventListener(
    "beforeinput",
    (event) => {
      if (veto) event.preventDefault()
    },
    true,
  )
  editor.setRootElement(root)
  root.addEventListener("beforeinput", () => propagated++, true)
  setHost(review)

  try {
    const replacementSource = "Keep old text now"
    const start = replacementSource.indexOf("old text")

    editor.update(
      () => {
        const text = $createTextNode(replacementSource)
        $getRoot().clear().append($createParagraphNode().append(text))
        text.select(start, start + "old text".length)
      },
      { discrete: true },
    )
    review.setSuggesting(true)
    expect(editor.read(() => $getSelection()?.getTextContent() ?? "")).toBe(
      "old text",
    )

    const replacementEvent = new window.InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      data: "new 🛰️ words",
      inputType: "insertText",
    })

    editor.update(() => root.dispatchEvent(replacementEvent), {
      discrete: true,
    })
    expect(replacementEvent.defaultPrevented).toBe(true)
    expect(propagated).toBe(0)
    const nativeInsertion = observed.at(-1)

    expect(review.getView().suggestions).toHaveLength(0)
    review.setSuggesting(false)
    editor.update(
      () => {
        const text = $createTextNode("alpha beta gamma")
        $getRoot().clear().append($createParagraphNode().append(text))
        text.select(6, 10)
      },
      { discrete: true },
    )
    review.setSuggesting(true)

    const cases = [
      { inputType: "deleteWordBackward", command: "word", backward: true },
      { inputType: "deleteWordForward", command: "word", backward: false },
      { inputType: "deleteHardLineBackward", command: "line", backward: true },
      { inputType: "deleteHardLineForward", command: "line", backward: false },
      { inputType: "deleteSoftLineBackward", command: "line", backward: true },
      { inputType: "deleteSoftLineForward", command: "line", backward: false },
    ] as const

    const observedRoutes: ({
      command: "word" | "line"
      backward: boolean
    } | null)[] = []

    for (const item of cases) {
      editor.update(
        () => {
          const text = $getRoot().getAllTextNodes()[0]

          if (!text) throw new Error("Missing deletion target.")
          text.select(6, 10)
        },
        { discrete: true },
      )
      observed.length = 0
      expect(editor.read(() => $getSelection()?.getTextContent() ?? "")).toBe(
        "beta",
      )

      const event = new window.InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: item.inputType,
      })

      editor.update(() => root.dispatchEvent(event), { discrete: true })
      expect(event.defaultPrevented).toBe(true)
      expect(propagated).toBe(0)
      const route = observed.at(-1)

      observedRoutes.push(
        route && route.command !== "text"
          ? { command: route.command, backward: route.backward }
          : null,
      )
    }

    review.setSuggesting(false)
    editor.update(
      () => {
        const text = $createTextNode("Keep host cancellation")
        $getRoot().clear().append($createParagraphNode().append(text))
        text.select(5, 10)
      },
      { discrete: true },
    )
    review.setSuggesting(true)
    observed.length = 0
    const beforeVeto = JSON.stringify(editor.getEditorState().toJSON())
    veto = true

    const vetoed = new window.InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "deleteWordBackward",
    })

    editor.update(() => root.dispatchEvent(vetoed), { discrete: true })
    expect(observedRoutes).toEqual(
      cases.map(({ command, backward }) => ({ command, backward })),
    )
    expect(review.getView().suggestions).toHaveLength(0)
    expect(nativeInsertion).toEqual({ command: "text", value: "new 🛰️ words" })
    expect(vetoed.defaultPrevented).toBe(true)
    expect(propagated).toBe(1)
    expect(observed).toHaveLength(0)
    expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(beforeVeto)
  } finally {
    editor.setRootElement(null)
    editor.dispose()

    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }
})
